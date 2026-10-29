// Compatibility implementation of Master's API v1 for D1/R2. The Python source
// remains the contract reference; request state is owned here, never by the UI.
const sid=prefix=>prefix+'_'+crypto.randomUUID().replaceAll('-','');
const changed=r=>Number(r?.meta?.changes??r?.changes??0);
const timestamp=n=>new Date(n).toISOString();
const submissionData=row=>({id:row.id,session_id:row.session_id,step_id:row.step_id,status:row.status,created_at:timestamp(row.created_at),assessment:row.assessment?JSON.parse(row.assessment):null,image_available:!!row.image_key&&row.status!=='processing'});
export async function authorizeSession(env,id,token,user=null){
 const row=await env.DB.prepare('SELECT * FROM practice_sessions WHERE id=?').bind(id).first();
 if(row?.owner_id){if(row.owner_id===user?.id)return row;throw new AppError('invalid_session_access','This practice belongs to a different account. Sign in with its account.',401);}
 if(typeof token!=='string'||!token||!row||row.token_hash!==await digest(token))throw new AppError('invalid_session_access','A valid session bearer token is required.',401);
 if(!row)throw new AppError('invalid_session_access','A valid session bearer token is required.',401);
 return row;
}
async function recoverSession(env,id){
 // A durable lease replaces the Python server's single-process startup recovery.
 const expired=Date.now()-120000;
 await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO practice_usage(id,session_id,submission_id,provider,model,status,created_at) SELECT 'expired_'||id,session_id,id,'unknown','unknown','failed',? FROM practice_submissions WHERE session_id=? AND status='processing' AND created_at<?").bind(Date.now(),id,expired),
  env.DB.prepare("UPDATE practice_submissions SET status='failed' WHERE session_id=? AND status='processing' AND created_at<?").bind(id,expired)
 ]);
}
export async function sessionProgress(env,session,origin){
 const lesson=await getLesson(env,session.lesson_id,origin),steps=lesson.steps,index=session.current_index;
 const a=await env.DB.prepare('SELECT step_id FROM practice_acknowledgements WHERE session_id=?').bind(session.id).all();
 const manual=new Set(a.results.map(x=>x.step_id));
 return {session_id:session.id,lesson_id:lesson.id,account_owned:!!session.owner_id,status:index>=steps.length?'completed':'active',current_step_id:steps[index]?.id??null,completed_step_ids:steps.slice(0,index).map(s=>s.id),completed_checkpoints:steps.slice(0,index).map(s=>({step_id:s.id,kind:manual.has(s.id)?'self':'photo'})),total_steps:steps.length,updated_at:timestamp(session.updated_at)};
}
export async function createPracticeSession(env,body,origin,user=null){
 if(typeof body.lesson_id!=='string')throw new AppError('invalid_lesson_id','Choose a lesson.');
 const lessonOwner=await authorizeLesson(env,body.lesson_id,user);
 if(lessonOwner&&body.save_to_account!==true)throw new AppError('account_practice_required','Start this private lesson as an account practice.',422);
 const lesson=await getLesson(env,body.lesson_id,origin);
 const owner=body.save_to_account===true?await ensureAccount(env,accountRequired(user)):null;
 if(body.save_to_account!==undefined&&typeof body.save_to_account!=='boolean')throw new AppError('invalid_account_mode','Choose whether to save to your signed-in account.');
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''),id=sid('session'),now=Date.now();
 await env.DB.prepare('INSERT INTO practice_sessions(id,lesson_id,token_hash,created_at,updated_at,owner_id,total_steps) VALUES(?,?,?,?,?,?,?)').bind(id,body.lesson_id,await digest(token),now,now,owner?.id||null,lesson.steps.length).run();
 return {...await sessionProgress(env,await authorizeSession(env,id,token,user),origin),access_token:token,account_owned:!!owner};
}
function idem(value){if(typeof value!=='string'||value.length<1||value.length>128)throw new AppError('invalid_idempotency_key','Idempotency-Key must contain 1–128 characters.');return value;}

async function submissionResponse(env,row,session,origin,replayed){return {submission:submissionData(row),progress:await sessionProgress(env,session,origin),replayed};}
export async function submitPractice(env,session,body,key,origin,assessor=assessPhoto){
 idem(key);if('mock_result'in body)throw new AppError('invalid_mock_result','Caller-selected mock results are disabled.');
 if(typeof body.step_id!=='string')throw new AppError('invalid_step','Choose a lesson step.');
 const bytes=imageBytes(body),hash=await digest(JSON.stringify([body.step_id,body.mime_type,body.image_base64]));
 const previous=await env.DB.prepare('SELECT * FROM practice_submissions WHERE session_id=? AND idem_key=?').bind(session.id,key).first();
 if(previous){if(previous.request_hash!==hash)throw new AppError('idempotency_conflict','This key was used for a different photo.',409);return submissionResponse(env,previous,await getSession(env,session.id),origin,true);}
 const lesson=await getLesson(env,session.lesson_id,origin),step=lesson.steps[session.current_index];
 if(!step||step.id!==body.step_id)throw new AppError('step_not_current','Submit only for the current checkpoint. Refresh saved progress.',409);
 if(step.photo_assessable===false)throw new AppError('not_visually_assessable','Use a self-practice acknowledgement for this checkpoint.');
 if(!env.BUCKET)throw new AppError('storage_unavailable','Photo storage is unavailable. Try again later.',503);
 const id=sid('sub'),now=Date.now(),imageKey='practice/'+session.id+'/'+id;
 let claimed;
 try{claimed=await env.DB.prepare("INSERT INTO practice_submissions(id,session_id,step_id,idem_key,request_hash,status,created_at,mime_type,image_key) SELECT ?,?,?,?,?,'processing',?,?,? WHERE EXISTS(SELECT 1 FROM practice_sessions WHERE id=? AND current_index=?) AND NOT EXISTS(SELECT 1 FROM practice_submissions WHERE session_id=? AND status='processing') AND (SELECT COUNT(*) FROM practice_submissions WHERE session_id=?)<100 AND NOT EXISTS(SELECT 1 FROM practice_live_leases WHERE session_id=? AND active=1 AND expires_at>?)").bind(id,session.id,step.id,key,hash,now,body.mime_type,imageKey,session.id,session.current_index,session.id,session.id,session.id,now).run();}catch{
  const raced=await env.DB.prepare('SELECT * FROM practice_submissions WHERE session_id=? AND idem_key=?').bind(session.id,key).first();if(raced){if(raced.request_hash!==hash)throw new AppError('idempotency_conflict','This key was used for a different photo.',409);return submissionResponse(env,raced,await getSession(env,session.id),origin,true);}throw new AppError('storage_unavailable','Could not record the submission. Retry with the same key.',503);
 }
 if(!changed(claimed)){const replay=await env.DB.prepare('SELECT * FROM practice_submissions WHERE session_id=? AND idem_key=?').bind(session.id,key).first();if(replay){if(replay.request_hash!==hash)throw new AppError('idempotency_conflict','This key was used for a different photo.',409);return submissionResponse(env,replay,await getSession(env,session.id),origin,true);}throw new AppError('assessment_in_progress','Progress changed, another assessment is pending, or the 100-photo session limit was reached. Refresh the session.',409);}
 let assessment;
 try{
  try{await env.BUCKET.put(imageKey,bytes,{httpMetadata:{contentType:body.mime_type}});}catch(uploadError){
   // A delayed upload may write even after its response is lost. Restore the
   // durable reference if an expired request was deleted while put was pending.
   await env.DB.prepare('UPDATE practice_submissions SET image_key=? WHERE id=? AND session_id=?').bind(imageKey,id,session.id).run();
   try{await env.BUCKET.delete(imageKey);await env.DB.prepare('UPDATE practice_submissions SET image_key=NULL WHERE id=? AND image_key=?').bind(id,imageKey).run();}catch{/* Keep the reference so history can retry deletion after recovery. */}
   throw uploadError;
  }
  // The object reference is committed in the claim before upload. Even an
  // ambiguous R2 failure leaves a discoverable image that its owner can delete.
  const stored=await env.DB.prepare('SELECT status,image_key FROM practice_submissions WHERE id=?').bind(id).first();
  if(stored?.status!=='processing'||stored.image_key!==imageKey){
   await env.BUCKET.delete(imageKey);
   await env.DB.prepare('UPDATE practice_submissions SET image_key=NULL WHERE id=? AND image_key=?').bind(id,imageKey).run();
   throw new AppError('submission_interrupted','The photo check expired before storage finished. Refresh history before trying again.',409);
  }
  assessment=await assessor(env,{lesson,step,body:{...body,submission_id:id}});
  if(!assessment||!['pass','retry','uncertain'].includes(assessment.result)||!assessment.usage)throw new Error('Invalid assessment');
 }catch(error){
  await env.DB.batch([
   env.DB.prepare("INSERT OR IGNORE INTO practice_usage(id,session_id,submission_id,provider,model,status,created_at) VALUES(?,?,?,'unknown','unknown','failed',?)").bind(sid('usage'),session.id,id,Date.now()),
   env.DB.prepare("UPDATE practice_submissions SET status='failed' WHERE id=? AND status='processing'").bind(id)
  ]);
  if(error instanceof AppError)throw error;throw new AppError('assessment_failed','Photo assessment failed. Check history before starting a new submission.',502);
 }
 const u=assessment.usage;
 try{
  await env.DB.batch([
   env.DB.prepare("UPDATE practice_sessions SET current_index=current_index+1,updated_at=? WHERE id=? AND current_index=? AND ?='pass' AND EXISTS(SELECT 1 FROM practice_submissions WHERE id=? AND status='processing')").bind(Date.now(),session.id,session.current_index,assessment.result,id),
   env.DB.prepare("INSERT OR IGNORE INTO practice_usage(id,session_id,submission_id,provider,model,status,estimated_cost_usd,input_tokens,output_tokens,created_at) SELECT ?,?,?,?,?,'succeeded',?,?,?,? WHERE EXISTS(SELECT 1 FROM practice_submissions WHERE id=? AND status='processing')").bind(sid('usage'),session.id,id,assessment.provider,assessment.model,u.estimated_cost_usd??null,u.input_tokens??null,u.output_tokens??null,Date.now(),id),
   env.DB.prepare("UPDATE practice_submissions SET assessment=?,status='assessed' WHERE id=? AND status='processing'").bind(JSON.stringify(assessment),id)
  ]);
 }catch{throw new AppError('finalization_failed','Could not save feedback. Retrieve history before retrying; do not create a new request yet.',503);}
 return submissionResponse(env,await env.DB.prepare('SELECT * FROM practice_submissions WHERE id=?').bind(id).first(),await getSession(env,session.id),origin,false);
}
async function getSession(env,id){return env.DB.prepare('SELECT * FROM practice_sessions WHERE id=?').bind(id).first();}
export async function liveAssessment(env,body,token,origin,assessor=assessPhoto,user=null){
 if(typeof body.session_id!=='string'||!body.session_id)throw new AppError('invalid_session_access','Open a saved practice before starting camera feedback.',401);
 const session=await authorizeSession(env,body.session_id,token,user);
 await recoverSession(env,session.id);
 const lesson=await getLesson(env,session.lesson_id,origin),step=lesson.steps[session.current_index];
 if(session.lesson_id!==body.lesson_id||!step||step.id!==body.step_id)throw new AppError('step_not_current','Use the current session checkpoint for camera feedback.',409);
 if(step.photo_assessable===false)throw new AppError('not_visually_assessable','This checkpoint needs self-review.');
 imageBytes(body);
 if(body.submission_id!==undefined&&(typeof body.submission_id!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(body.submission_id)))throw new AppError('invalid_submission_id','Use a valid frame identifier.');
 const claim=sid('live'),now=Date.now();
 const lease=await env.DB.prepare("INSERT INTO practice_live_leases(session_id,claim_id,created_at,expires_at,active) SELECT ?,?,?,?,1 WHERE EXISTS(SELECT 1 FROM practice_sessions WHERE id=? AND current_index=?) AND NOT EXISTS(SELECT 1 FROM practice_submissions WHERE session_id=? AND status='processing') ON CONFLICT(session_id) DO UPDATE SET claim_id=excluded.claim_id,created_at=excluded.created_at,expires_at=excluded.expires_at,active=1 WHERE (practice_live_leases.expires_at<=? OR (practice_live_leases.active=0 AND practice_live_leases.created_at<=?))").bind(session.id,claim,now,now+120000,session.id,session.current_index,session.id,now,now-3000).run();
 if(!changed(lease))throw new AppError('live_check_busy','A photo or camera check is already active, or a camera check just started. Wait a moment before trying again.',429);
 try{
  const result=await assessor(env,{lesson,step,body});
  const current=await getSession(env,session.id),active=await env.DB.prepare('SELECT claim_id,expires_at FROM practice_live_leases WHERE session_id=?').bind(session.id).first();
  if(!current||current.current_index!==session.current_index||active?.claim_id!==claim||active.expires_at<=Date.now())throw new AppError('stale_feedback','The checkpoint changed or camera feedback expired. Refresh saved progress.',409);
  await env.DB.batch([
   env.DB.prepare('INSERT INTO practice_camera_feedback(id,session_id,step_id,assessment,created_at) VALUES(?,?,?,?,?)').bind(claim,session.id,step.id,JSON.stringify(result),Date.now()),
   env.DB.prepare('DELETE FROM practice_camera_feedback WHERE session_id=? AND id NOT IN (SELECT id FROM practice_camera_feedback WHERE session_id=? ORDER BY created_at DESC,id DESC LIMIT 20)').bind(session.id,session.id)
  ]);
  return {...result,feedback_id:claim};
 }finally{
  // A late completion must never release a newer request's lease.
  await env.DB.prepare('UPDATE practice_live_leases SET active=0 WHERE session_id=? AND claim_id=?').bind(session.id,claim).run();
 }
}
export async function acknowledgePractice(env,session,body,key,origin){
 idem(key);
 const replay=async()=>{const existing=await env.DB.prepare('SELECT step_id FROM practice_acknowledgements WHERE session_id=? AND idem_key=?').bind(session.id,key).first();if(!existing)return null;if(existing.step_id!==body.step_id)throw new AppError('idempotency_conflict','This key was used for another checkpoint.',409);return {progress:await sessionProgress(env,await getSession(env,session.id),origin),replayed:true};};
 const previous=await replay();if(previous)return previous;
 const lesson=await getLesson(env,session.lesson_id,origin),step=lesson.steps[session.current_index];
 if(!step||step.id!==body.step_id)throw new AppError('step_not_current','Acknowledge only the current checkpoint.',409);
 const id=sid('ack'),now=Date.now();
 let batch;
 try{batch=await env.DB.batch([
  env.DB.prepare("INSERT INTO practice_acknowledgements(id,session_id,step_id,idem_key,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM practice_sessions WHERE id=? AND current_index=?) AND NOT EXISTS(SELECT 1 FROM practice_submissions WHERE session_id=? AND status='processing')").bind(id,session.id,step.id,key,now,session.id,session.current_index,session.id),
  env.DB.prepare('UPDATE practice_sessions SET current_index=current_index+1,updated_at=? WHERE id=? AND current_index=? AND EXISTS(SELECT 1 FROM practice_acknowledgements WHERE id=?)').bind(now,session.id,session.current_index,id)
 ]);}catch{const raced=await replay();if(raced)return raced;throw new AppError('assessment_in_progress','Progress changed. Refresh before continuing.',409);}
 if(!changed(batch[0])){const raced=await replay();if(raced)return raced;throw new AppError('assessment_in_progress','Wait for the pending photo check before acknowledging this step.',409);}
 return {progress:await sessionProgress(env,await getSession(env,session.id),origin),replayed:false};
}
export async function routeMaster(request,env,url){
 const path=url.pathname.replace(/\/$/,''),method=request.method,origin=url.origin;
 if(path==='/health'&&method==='GET'){
  if(!env.DB||!env.BUCKET?.get||!env.BUCKET?.put)throw new AppError('storage_unavailable','Practice storage is unavailable.',503);
  await env.DB.prepare('SELECT id,review_json FROM illustration_candidates LIMIT 1').first();
  // Compile a bounded read against every new runtime table, even when empty.
  // A process being alive must not conceal missing migrations or a database outage.
  await env.DB.prepare('SELECT (SELECT paused FROM ai_budget WHERE id=1) AS paused,(SELECT id FROM ai_reservations LIMIT 1) AS reservation,(SELECT session_id FROM practice_live_leases LIMIT 1) AS lease,(SELECT id FROM learner_accounts LIMIT 1) AS account,(SELECT owner_id FROM ai_lessons LIMIT 1) AS lesson_owner,(SELECT total_steps FROM practice_sessions LIMIT 1) AS steps,(SELECT draft_lesson_id FROM catalogue_entries LIMIT 1) AS catalogue,(SELECT lesson_id FROM catalogue_revisions LIMIT 1) AS revision,(SELECT context FROM learner_reports LIMIT 1) AS report,(SELECT id FROM practice_questions LIMIT 1) AS question').first();
  if(socialExtractionEnabled(env))await env.DB.prepare('SELECT id,job_kind,metadata_json FROM source_extractions LIMIT 1').first();
  return json({status:'ok',api_version:'v1',runtime:'worker-d1',mock_mode:false,storage:'ready'});
 }
 if(!path.startsWith('/v1/'))return null;
 const user=await requestUser(request);
 if(method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==origin)throw new AppError('origin_denied','Open this action from the Show Once app.',403);
 const questions=await routeQuestions(request,env,url,user);if(questions)return questions;
 if(path==='/v1/lessons'&&method==='GET')return json({lessons:await publishedLessons(env,origin)});
 if(path==='/v1/lessons'&&method==='POST')return lessonResponse(await ingestLesson(env,await bodyJSON(request),origin,user));
 let match=path.match(/^\/v1\/lessons\/([\w-]+)$/);if(match&&method==='GET'){await authorizeLesson(env,match[1],user,(request.headers.get('authorization')||'').replace(/^Bearer /,''),true);return json(await getLesson(env,match[1],origin));}
 if(path==='/v1/sessions'&&method==='POST')return json(await createPracticeSession(env,await bodyJSON(request),origin,user),201);
 match=path.match(/^\/v1\/sessions\/([\w-]+)(?:\/(progress|submissions|usage|acknowledgements|reports))?$/);
 const image=path.match(/^\/v1\/sessions\/([\w-]+)\/submissions\/([\w-]+)\/image$/);
 if(match||image){
  const id=(match||image)[1],token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');await authorizeSession(env,id,token,user);await recoverSession(env,id);const session=await getSession(env,id);
  if(image){const row=await env.DB.prepare('SELECT image_key,mime_type,status FROM practice_submissions WHERE id=? AND session_id=?').bind(image[2],id).first();
   if(method==='DELETE'){if(row?.status==='processing')throw new AppError('assessment_in_progress','Wait until the photo upload finishes before deleting it.',409);if(row?.image_key){await env.BUCKET.delete(row.image_key);await env.DB.prepare('UPDATE practice_submissions SET image_key=NULL WHERE id=? AND session_id=?').bind(image[2],id).run();}return new Response(null,{status:204});}
   if(method==='GET'){const object=row?.image_key?await env.BUCKET?.get(row.image_key):null;if(!object)throw new AppError('image_not_found','Photo is unavailable or deleted.',404);return new Response(object.body,{headers:{'Content-Type':row.mime_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
  }else{
   const resource=match[2];
   if(resource==='reports'&&method==='POST'){if(request.headers.get('origin')!==origin)throw new AppError('origin_denied','Open reporting from Show Once.',403);const result=await createReport(env,user,session,await bodyJSON(request),request.headers.get('idempotency-key'),origin);return json(result,result.replayed?200:201);}
   if(method==='GET'&&(!resource||resource==='progress'))return json(await sessionProgress(env,session,origin));
   if(resource==='submissions'&&method==='GET'){const rows=await env.DB.prepare('SELECT * FROM practice_submissions WHERE session_id=? ORDER BY created_at,id').bind(id).all();return json({submissions:rows.results.map(submissionData)});}
   if(resource==='usage'&&method==='GET'){const rows=await env.DB.prepare('SELECT * FROM practice_usage WHERE session_id=? ORDER BY created_at,id').bind(id).all();return json({events:rows.results.map(x=>({...x,created_at:timestamp(x.created_at)}))});}
   if(resource==='submissions'&&method==='POST'){const value=await submitPractice(env,session,await bodyJSON(request),request.headers.get('idempotency-key'),origin);return json(value,value.replayed?200:201);}
   if(resource==='acknowledgements'&&method==='POST')return json(await acknowledgePractice(env,session,await bodyJSON(request),request.headers.get('idempotency-key'),origin));
  }
 }
 throw new AppError('route_not_found','This action is unavailable.',404);
}
