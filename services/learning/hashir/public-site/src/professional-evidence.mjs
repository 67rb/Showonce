/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// Free evidence journal. Instructor access requires explicit learner sharing.
function evidenceRecord(row){return {id:row.id,lesson_id:row.lesson_id,criterion_id:row.criterion_id||null,notes:row.notes,status:row.status,has_photo:!!row.image_key&&row.status==='ready',created_at:row.created_at};}
async function evidenceAccess(env,id,user){
 const enrollment=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(id).first();
 if(!enrollment||enrollment.owner_id!==user.id&&(!isAdmin(env,user)||!enrollment.evidence_shared))throw new AppError('evidence_not_found','This evidence is not shared with your account.',404);
 return enrollment;
}
async function routeProEvidence(request,env,url,user){
 const path=url.pathname.replace(/\/$/,''),method=request.method;
 const listing=path.match(/^\/v1\/professional\/enrollments\/([\w-]+)\/evidence$/),sharing=path.match(/^\/v1\/professional\/enrollments\/([\w-]+)\/evidence-sharing$/),item=path.match(/^\/v1\/professional\/evidence\/([\w-]+)(?:\/(photo))?$/);
 if(!listing&&!sharing&&!item)return null;
 if(sharing&&method==='POST'){
  const row=await proEnrollment(env,sharing[1],user),body=await bodyJSON(request);
  if(body.shared!==false)throw new AppError('invalid_sharing','Share evidence through an explicit review request; use this action to stop sharing.');
  await env.DB.prepare('UPDATE professional_enrollments SET evidence_shared=0,version=version+1,updated_at=? WHERE id=?').bind(Date.now(),row.id).run();return json({shared:false});
 }
 if(listing){
  const enrollment=await evidenceAccess(env,listing[1],user);
  if(method==='GET'){const rows=await env.DB.prepare("SELECT * FROM professional_evidence WHERE enrollment_id=? AND status!='deleted' ORDER BY created_at,id LIMIT 50").bind(enrollment.id).all();return json({shared:!!enrollment.evidence_shared,evidence:rows.results.map(evidenceRecord)});}
  if(method==='POST'){
   if(enrollment.owner_id!==user.id)throw new AppError('evidence_not_found','Only the learner can add evidence.',404);
   const body=await bodyJSON(request),key=idem(request.headers.get('idempotency-key')),notes=shortText(body.notes??'','evidence_notes',2000,false);
   if(!proCourse(enrollment.course_id).lesson_ids.includes(body.lesson_id))throw new AppError('lesson_not_in_course','Attach evidence to a lesson in this course.');
   const photo=body.image_base64!==undefined||body.mime_type!==undefined,bytes=photo?imageBytes(body):null;
   if(!notes&&!bytes)throw new AppError('evidence_required','Add notes or a work photo.');
   if(bytes&&!env.BUCKET)throw new AppError('storage_unavailable','Photo storage is unavailable.',503);
   let criterionID=null;
   if(body.criterion_id!==undefined&&body.criterion_id!==null){
    if(typeof body.criterion_id!=='string')throw new AppError('invalid_criterion','Choose a criterion from this assignment rubric.');
    const assignment=await env.DB.prepare('SELECT criteria_json FROM professional_assignments WHERE enrollment_id=?').bind(enrollment.id).first();
    if(!assignment||!JSON.parse(assignment.criteria_json).some(item=>item.id===body.criterion_id))throw new AppError('invalid_criterion','Choose a criterion from this assignment rubric.');
    criterionID=body.criterion_id;
   }
   const hash=await digest(JSON.stringify([body.lesson_id,notes,body.mime_type||null,body.image_base64||null,criterionID]));
   let row=await env.DB.prepare('SELECT * FROM professional_evidence WHERE enrollment_id=? AND request_key=?').bind(enrollment.id,key).first();
   if(row&&row.request_hash!==hash)throw new AppError('idempotency_conflict','This save key was used for different evidence.',409);
   if(row&&['ready','deleted'].includes(row.status))return json(evidenceRecord(row));
   if(!['learning','changes_requested'].includes(enrollment.status))throw new AppError('review_in_progress','Evidence is locked during review or after approval. Ask the instructor for changes before adding more.',409);
   if(!row){
    const id=sid('evidence'),imageKey=photo?'professional-evidence/'+id:null;
    // A second request may have won since the read above. Only the insert
    // winner owns this upload; the other request re-reads the durable record.
    const inserted=await env.DB.prepare("INSERT INTO professional_evidence(id,enrollment_id,owner_id,lesson_id,notes,image_key,mime_type,request_key,request_hash,status,created_at,criterion_id) SELECT ?,?,?,?,?,?,?,?,?,'uploading',?,? WHERE (SELECT COUNT(*) FROM professional_evidence WHERE enrollment_id=?)<50 AND EXISTS(SELECT 1 FROM professional_enrollments WHERE id=? AND status IN ('learning','changes_requested')) ON CONFLICT(enrollment_id,request_key) DO NOTHING").bind(id,enrollment.id,user.id,body.lesson_id,notes,imageKey,photo?body.mime_type:null,key,hash,Date.now(),criterionID,enrollment.id,enrollment.id).run();
    if(changed(inserted))row=await env.DB.prepare('SELECT * FROM professional_evidence WHERE id=?').bind(id).first();
    else{
     row=await env.DB.prepare('SELECT * FROM professional_evidence WHERE enrollment_id=? AND request_key=?').bind(enrollment.id,key).first();
     if(!row)throw new AppError('evidence_limit','Evidence is locked or this course has reached its 50-record limit.',409);
     if(row.request_hash!==hash)throw new AppError('idempotency_conflict','This save key was used for different evidence.',409);
     if(['ready','deleted'].includes(row.status))return json(evidenceRecord(row));
     // Fall through to the failed-upload claim, never start another active upload.
     const retry=await env.DB.prepare("UPDATE professional_evidence SET status='uploading' WHERE id=? AND status='failed' AND EXISTS(SELECT 1 FROM professional_enrollments WHERE id=? AND status IN ('learning','changes_requested'))").bind(row.id,enrollment.id).run();
     if(!changed(retry))throw new AppError('evidence_busy','This evidence is already being saved or the course is locked. Wait a moment, then retry with the same save key.',409);
    }
   }else{
    const retry=await env.DB.prepare("UPDATE professional_evidence SET status='uploading' WHERE id=? AND status='failed' AND EXISTS(SELECT 1 FROM professional_enrollments WHERE id=? AND status IN ('learning','changes_requested'))").bind(row.id,enrollment.id).run();
    if(!changed(retry))throw new AppError('evidence_busy','This evidence is already being saved or the course is locked. Wait a moment, then retry with the same save key.',409);
   }
   try{if(bytes)await env.BUCKET.put(row.image_key,bytes,{httpMetadata:{contentType:row.mime_type}});await env.DB.prepare("UPDATE professional_evidence SET status='ready' WHERE id=? AND status!='deleted'").bind(row.id).run();}
   catch{await env.DB.prepare("UPDATE professional_evidence SET status='failed' WHERE id=? AND status!='deleted'").bind(row.id).run();throw new AppError('evidence_save_failed','Could not finish the photo upload. Retry the same evidence with the same save key.',503);}
   return json(evidenceRecord(await env.DB.prepare('SELECT * FROM professional_evidence WHERE id=?').bind(row.id).first()),201);
  }
 }
 if(item){
  const row=await env.DB.prepare('SELECT * FROM professional_evidence WHERE id=?').bind(item[1]).first();if(!row||row.status==='deleted')throw new AppError('evidence_not_found','Evidence unavailable.',404);
  await evidenceAccess(env,row.enrollment_id,user);
  if(item[2]==='photo'&&method==='GET'){const photo=row.status==='ready'&&row.image_key?await env.BUCKET.get(row.image_key):null;if(!photo)throw new AppError('image_not_found','Photo unavailable.',404);return new Response(photo.body,{headers:{'Content-Type':row.mime_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
  if(!item[2]&&method==='DELETE'){
   if(row.owner_id!==user.id)throw new AppError('evidence_not_found','Only the learner can remove evidence.',404);
   if(row.status==='uploading')throw new AppError('evidence_busy','Wait for the upload to finish before removing it.',409);
   if(row.image_key)await env.BUCKET.delete(row.image_key);
   await env.DB.batch([env.DB.prepare("UPDATE professional_evidence SET status='deleted',notes='',image_key=NULL WHERE id=?").bind(row.id),env.DB.prepare('UPDATE professional_enrollments SET version=version+1,updated_at=? WHERE id=?').bind(Date.now(),row.enrollment_id)]);return new Response(null,{status:204});
  }
 }
 throw new AppError('method_not_allowed','Use an available evidence action.',405);
}
