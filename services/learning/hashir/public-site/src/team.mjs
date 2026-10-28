// Catalogue pointers are mutable; lesson revisions and existing practices are not.
function shortText(value,label,max=400,required=true){
 if(typeof value!=='string'||value.length>max||required&&!value.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new AppError('invalid_'+label,'Provide valid '+label.replaceAll('_',' ')+' (up to '+max+' characters).');
 return value.trim();
}
function catalogueLink(value){
 if(value===null||value==='')return null;
 if(typeof value!=='string'||value.length>2048)throw new AppError('invalid_link','Use an HTTPS source link.');
 if(EXAMPLES.some(example=>example.source_url===value&&value.startsWith('/examples/')))return value;
 try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
 throw new AppError('invalid_link','Use an HTTPS source link.');
}
async function seedCatalogue(env){
 const now=Date.now();await env.DB.batch(EXAMPLES.map(lesson=>env.DB.prepare('INSERT OR IGNORE INTO catalogue_entries(id,draft_lesson_id,published_lesson_id,version,created_at,updated_at) VALUES(?,?,?,1,?,?)').bind(lesson.id,lesson.id,lesson.id,now,now)));
}
export async function publishedLessons(env,origin){
 const rows=(await env.DB.prepare('SELECT c.id,c.published_lesson_id,l.content FROM catalogue_entries c LEFT JOIN ai_lessons l ON l.id=c.published_lesson_id ORDER BY c.created_at,c.id').all()).results,overrides=new Map(rows.map(row=>[row.id,row]));
 const ordered=EXAMPLES.map(lesson=>overrides.get(lesson.id)||{published_lesson_id:lesson.id}).concat(rows.filter(row=>!EXAMPLES.some(lesson=>lesson.id===row.id)));
 return ordered.filter(row=>row.published_lesson_id).map(row=>{const lesson=row.content?JSON.parse(row.content):example(row.published_lesson_id,origin);if(!lesson)throw new AppError('catalogue_unavailable','The lesson catalogue could not be loaded.',503);if(lesson.source_url?.startsWith('/'))lesson.source_url=origin+lesson.source_url;for(const step of lesson.steps)if(step.source_reference?.url?.startsWith('/'))step.source_reference.url=origin+step.source_reference.url;return lesson;});
}
async function publishedExample(env,id,origin){
 const row=await env.DB.prepare('SELECT published_lesson_id FROM catalogue_entries WHERE id=?').bind(id).first();
 if(row)return row.published_lesson_id?getLesson(env,row.published_lesson_id,origin):null;
 return (await publishedLessons(env,origin)).find(lesson=>lesson.id===id)||null;
}
async function catalogueVisible(env,id,user,token='',allowExisting=false){
 const revision=await env.DB.prepare('SELECT entry_id FROM catalogue_revisions WHERE lesson_id=?').bind(id).first();
 const entry=await env.DB.prepare('SELECT published_lesson_id FROM catalogue_entries WHERE id=?').bind(revision?.entry_id||id).first();
 if(!entry||entry.published_lesson_id===id||isAdmin(env,user))return;
 if(allowExisting){
  const own=user?await env.DB.prepare('SELECT id FROM practice_sessions WHERE lesson_id=? AND owner_id=? LIMIT 1').bind(id,user.id).first():null;
  const guest=token?await env.DB.prepare('SELECT id FROM practice_sessions WHERE lesson_id=? AND owner_id IS NULL AND token_hash=? LIMIT 1').bind(id,await digest(token)).first():null;
  if(own||guest)return;
 }
 throw new AppError('lesson_not_found','That lesson is not currently published. Existing practices remain available.',404);
}
function catalogueRecord(row){return {...row,published:!!row.published_lesson_id,created_at:timestamp(row.created_at),updated_at:timestamp(row.updated_at)};}
async function catalogueDetail(env,id,origin){
 const row=await env.DB.prepare('SELECT * FROM catalogue_entries WHERE id=?').bind(id).first();if(!row)throw new AppError('catalogue_not_found','Choose an existing catalogue entry.',404);
 return {...catalogueRecord(row),lesson:row.draft_lesson_id?await getLesson(env,row.draft_lesson_id,origin):null};
}
async function saveCatalogue(env,user,id,body,origin){
 adminRequired(env,user);await ensureAccount(env,user);
 if(!Number.isSafeInteger(body.expected_version)||body.expected_version<0)throw new AppError('invalid_version','Reload this entry before editing.');
 const title=shortText(body.title,'title',160),category=shortText(body.category,'category',80),attribution=shortText(body.source_attribution,'source_attribution',1200);
 if(!Array.isArray(body.materials)||body.materials.length>30)throw new AppError('invalid_materials','Provide up to 30 materials.');
 const materials=body.materials.map(value=>shortText(value,'material',200)),source_url=catalogueLink(body.source_url),difficulty=body.difficulty?shortText(body.difficulty,'difficulty',200):null;
 const existing=id?await env.DB.prepare('SELECT * FROM catalogue_entries WHERE id=?').bind(id).first():null;
 if(id&&!existing)throw new AppError('catalogue_not_found','Choose an existing catalogue entry.',404);
 if(existing&&existing.version!==body.expected_version||!existing&&body.expected_version!==0)throw new AppError('catalogue_conflict','Another edit changed this entry. Reload it before saving.',409);
 let lesson;
 const source_text=body.source_text===undefined?'':shortText(body.source_text,'source_text',24000,false);
 if(source_text)lesson=await numberedLesson({text:source_text,source_url,origin:'structured_text'});
 else if(existing?.draft_lesson_id)lesson=structuredClone(await getLesson(env,existing.draft_lesson_id,origin));
 else throw new AppError('numbered_steps_required','Add 2–18 numbered instructions for a new lesson.');
 // Existing checkpoint content is retained unless the editor explicitly supplies
 // new numbered instructions. Those become self-review, without a paid AI call.
 lesson={...lesson,id:sid('lesson'),title,category,difficulty,materials,source_url,source_attribution:attribution};
 if(!source_text)for(const step of lesson.steps){if(step.source_reference)step.source_reference.url=source_url;}
 const entryID=id||sid('catalogue'),now=Date.now(),expected=body.expected_version,statements=[];
 if(!existing)statements.push(env.DB.prepare('INSERT INTO catalogue_entries(id,version,created_at,updated_at) SELECT ?,0,?,? WHERE (SELECT COUNT(*) FROM catalogue_entries)<1000').bind(entryID,now,now));
 statements.push(
  env.DB.prepare('INSERT INTO ai_lessons(id,content,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM catalogue_entries WHERE id=? AND version=?)').bind(lesson.id,JSON.stringify(lesson),now,entryID,expected),
  env.DB.prepare('INSERT INTO catalogue_revisions(lesson_id,entry_id,created_by,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM ai_lessons WHERE id=?)').bind(lesson.id,entryID,user.id,now,lesson.id),
  env.DB.prepare('UPDATE catalogue_entries SET draft_lesson_id=?,version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM catalogue_revisions WHERE lesson_id=?)').bind(lesson.id,now,entryID,expected,lesson.id)
 );
 const result=await env.DB.batch(statements);if(!changed(result.at(-1)))throw new AppError('catalogue_conflict','The entry changed or the catalogue limit was reached. Reload before saving.',409);
 return catalogueDetail(env,entryID,origin);
}
async function publishCatalogue(env,id,body,origin){
 if(!Number.isSafeInteger(body.expected_version)||typeof body.published!=='boolean')throw new AppError('invalid_version','Reload the entry before changing publication.');
 const result=await env.DB.prepare('UPDATE catalogue_entries SET published_lesson_id=CASE WHEN ? THEN draft_lesson_id ELSE NULL END,version=version+1,updated_at=? WHERE id=? AND version=? AND draft_lesson_id IS NOT NULL').bind(body.published?1:0,Date.now(),id,body.expected_version).run();
 if(!changed(result))throw new AppError('catalogue_conflict','Another edit changed this entry. Reload it before publishing.',409);
 return catalogueDetail(env,id,origin);
}
const reportReasons=['incorrect_instructions','ai_feedback','broken_source','other'];
export async function createReport(env,user,session,body,key,origin){
 idem(key);if(!reportReasons.includes(body.reason))throw new AppError('invalid_report_reason','Choose an issue type.');
 const details=shortText(body.details||'','report_details',2000,false),lesson=await getLesson(env,session.lesson_id,origin),step=lesson.steps.find(step=>step.id===body.step_id);
 if(!step)throw new AppError('invalid_step','Choose a checkpoint from this practice.');
 if(body.lesson_id!==undefined&&body.lesson_id!==lesson.id)throw new AppError('invalid_lesson_id','Report a checkpoint from this practice.');
 let submission=null;
 if(body.submission_id!==undefined&&body.submission_id!==null){
  if(typeof body.submission_id!=='string')throw new AppError('invalid_submission_id','Choose feedback from this practice.');
  const row=await env.DB.prepare('SELECT id,step_id,status,assessment FROM practice_submissions WHERE id=? AND session_id=? AND step_id=?').bind(body.submission_id,session.id,step.id).first();
  if(!row)throw new AppError('invalid_submission_id','Choose feedback from this checkpoint.');
  submission={id:row.id,status:row.status,assessment:row.assessment?JSON.parse(row.assessment):null};
 }
 let camera_feedback=null;
 if(body.camera_feedback_id!==undefined&&body.camera_feedback_id!==null){
  if(typeof body.camera_feedback_id!=='string')throw new AppError('invalid_feedback_id','Choose camera feedback from this practice.');
  const row=await env.DB.prepare('SELECT id,assessment,created_at FROM practice_camera_feedback WHERE id=? AND session_id=? AND step_id=?').bind(body.camera_feedback_id,session.id,step.id).first();
  if(!row)throw new AppError('invalid_feedback_id','That camera feedback is no longer available. Report the checkpoint with a description instead.');
  camera_feedback={id:row.id,assessment:JSON.parse(row.assessment),created_at:timestamp(row.created_at)};
 }
 const hash=await digest(JSON.stringify([step.id,body.reason,details,submission?.id||null,camera_feedback?.id||null]));
 const previous=await env.DB.prepare('SELECT id,request_hash FROM learner_reports WHERE session_id=? AND idem_key=?').bind(session.id,key).first();
 if(previous){if(previous.request_hash!==hash)throw new AppError('idempotency_conflict','This report key was used for different details.',409);return {id:previous.id,status:'received',replayed:true};}
 const now=Date.now(),id=sid('report'),context={lesson_title:lesson.title,category:lesson.category,source_url:lesson.source_url,source_attribution:lesson.source_attribution||null,step:structuredClone(step),submission,camera_feedback};
 // Store only the reported checkpoint and deliberately selected saved feedback.
 // Photos, other checkpoints and browser/session access are never included.
 const result=await env.DB.prepare("INSERT OR IGNORE INTO learner_reports(id,session_id,lesson_id,step_id,reporter_id,reason,details,context,idem_key,request_hash,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM learner_reports WHERE session_id=? AND created_at>?)<10 AND (? IS NULL OR (SELECT COUNT(*) FROM learner_reports WHERE reporter_id=? AND created_at>?)<30)").bind(id,session.id,lesson.id,step.id,user?.id||null,body.reason,details,JSON.stringify(context),key,hash,now,now,session.id,now-86400000,user?.id||null,user?.id||null,now-86400000).run();
 if(!changed(result)){const replay=await env.DB.prepare('SELECT id,request_hash FROM learner_reports WHERE session_id=? AND idem_key=?').bind(session.id,key).first();if(replay){if(replay.request_hash!==hash)throw new AppError('idempotency_conflict','This report key was used for different details.',409);return {id:replay.id,status:'received',replayed:true};}throw new AppError('report_limit','Report limit reached for today. Your existing reports are saved.',429);}
 return {id,status:'received',replayed:false};
}
function reportData(row){const {idem_key,request_hash,...report}=row;return {...report,context:JSON.parse(report.context),created_at:timestamp(report.created_at),updated_at:timestamp(report.updated_at)};}
export async function routeTeam(request,env,url){
 const path=url.pathname.replace(/\/$/,''),method=request.method;
 if(!path.startsWith('/v1/admin/'))return null;
 const user=adminRequired(env,await requestUser(request));
 if(method!=='GET'&&request.headers.get('origin')!==url.origin)throw new AppError('origin_denied','Open this action from Show Once.',403);
 if(path==='/v1/admin/catalogue'&&method==='GET'){
  await seedCatalogue(env);let before=Number.MAX_SAFE_INTEGER,beforeID='~';const cursor=url.searchParams.get('before');
  if(cursor)try{if(cursor.length>500)throw 0;const value=JSON.parse(atob(cursor));if(!Array.isArray(value)||value.length!==2||!Number.isSafeInteger(value[0])||typeof value[1]!=='string'||!/^[-\w]{1,200}$/.test(value[1]))throw 0;[before,beforeID]=value;}catch{throw new AppError('invalid_cursor','Reload the catalogue.');}
  const rows=(await env.DB.prepare('SELECT c.*,l.content AS draft_content FROM catalogue_entries c LEFT JOIN ai_lessons l ON l.id=c.draft_lesson_id WHERE c.updated_at<? OR (c.updated_at=? AND c.id<?) ORDER BY c.updated_at DESC,c.id DESC LIMIT 26').bind(before,before,beforeID).all()).results;
  const entries=rows.slice(0,25).map(({draft_content,...row})=>({...catalogueRecord(row),title:draft_content?JSON.parse(draft_content).title:EXAMPLES.find(lesson=>lesson.id===row.draft_lesson_id)?.title||'Untitled draft'}));return json({entries,next_cursor:rows.length>25?btoa(JSON.stringify([rows[24].updated_at,rows[24].id])):null});
 }
 if(path==='/v1/admin/catalogue'&&method==='POST'){await seedCatalogue(env);return json(await saveCatalogue(env,user,null,await bodyJSON(request),url.origin),201);}
 const match=path.match(/^\/v1\/admin\/catalogue\/([\w-]+)(\/publication)?$/);
 if(match){await seedCatalogue(env);if(method==='GET'&&!match[2])return json(await catalogueDetail(env,match[1],url.origin));if(method==='POST')return json(match[2]?await publishCatalogue(env,match[1],await bodyJSON(request),url.origin):await saveCatalogue(env,user,match[1],await bodyJSON(request),url.origin));}
 if(path==='/v1/admin/reports'&&method==='GET'){
  const status=url.searchParams.get('status')||'open';if(!['open','triaged','resolved','dismissed','all'].includes(status))throw new AppError('invalid_report_status','Choose a report status.');
  const cursor=url.searchParams.get('before');let before=Number.MAX_SAFE_INTEGER,beforeID='~';
  if(cursor)try{if(cursor.length>500)throw 0;const value=JSON.parse(atob(cursor));if(!Array.isArray(value)||value.length!==2||!Number.isSafeInteger(value[0])||typeof value[1]!=='string'||!/^report_[a-f0-9]+$/.test(value[1]))throw 0;[before,beforeID]=value;}catch{throw new AppError('invalid_cursor','Reload the report queue.');}
  const rows=(await env.DB.prepare("SELECT * FROM learner_reports WHERE (?='all' OR status=?) AND (created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT 26").bind(status,status,before,before,beforeID).all()).results;
  return json({reports:rows.slice(0,25).map(reportData),next_cursor:rows.length>25?btoa(JSON.stringify([rows[24].created_at,rows[24].id])):null});
 }
 const report=path.match(/^\/v1\/admin\/reports\/([\w-]+)$/);
 if(report&&method==='POST'){
  const body=await bodyJSON(request);if(!['open','triaged','resolved','dismissed'].includes(body.status)||!Number.isSafeInteger(body.expected_version))throw new AppError('invalid_report_status','Reload and choose a review status.');
  const notes=shortText(body.review_notes||'','review_notes',2000,false),result=await env.DB.prepare('UPDATE learner_reports SET status=?,review_notes=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(body.status,notes,Date.now(),report[1],body.expected_version).run();
  if(!changed(result))throw new AppError('report_conflict','This report changed. Reload it before reviewing.',409);
  return json(reportData(await env.DB.prepare('SELECT * FROM learner_reports WHERE id=?').bind(report[1]).first()));
 }
 throw new AppError('route_not_found','This team action is unavailable.',404);
}
