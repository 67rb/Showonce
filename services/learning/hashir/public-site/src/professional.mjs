// Isolated professional edition. AI feedback never writes instructor decisions.
const PRO_CATALOGUE=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(ASSETS['/professional-catalogue.json'].data),c=>c.charCodeAt(0))));
const proCourse=id=>{const value=PRO_CATALOGUE.courses.find(item=>item.id===id);if(!value)throw new AppError('course_not_found','Choose an available course.',404);return value;};
const proSessionID=async(owner,course,lesson)=>'pro_session_'+await digest(JSON.stringify([owner,course,lesson]));
async function proEnrollment(env,id,user){
 const row=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=? AND owner_id=?').bind(id,accountRequired(user).id).first();
 if(!row)throw new AppError('enrollment_not_found','This enrollment is not available to your account.',404);return row;
}
async function proDetail(env,row){
 const course=proCourse(row.course_id),lessons=[];
 for(const id of course.lesson_ids){
  const lesson=PRO_CATALOGUE.lessons.find(item=>item.id===id),sessionID=await proSessionID(row.owner_id,course.id,id);
  const session=await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=? AND owner_id=?').bind(sessionID,row.owner_id).first();
  lessons.push({id,title:lesson.title,total_steps:lesson.steps.length,completed_steps:Math.min(session?.current_index||0,lesson.steps.length),session_id:session?sessionID:null});
 }
 const reviews=(await env.DB.prepare('SELECT decision,notes,created_at FROM professional_reviews WHERE enrollment_id=? ORDER BY created_at,id').bind(row.id).all()).results;
 const evidenceCount=await env.DB.prepare("SELECT COUNT(*) AS count FROM professional_evidence WHERE enrollment_id=? AND status='ready'").bind(row.id).first();
 return {...row,evidence_count:Number(evidenceCount?.count||0),course,lessons,reviews,practice_complete:lessons.every(item=>item.completed_steps===item.total_steps),qualification:false};
}
function rubricList(value,label,max=10){
 if(!Array.isArray(value)||!value.length||value.length>max)throw new AppError('invalid_'+label,'Provide between 1 and '+max+' '+label.replaceAll('_',' ')+'.');
 const seen=new Set();
 return value.map((item,index)=>{
  if(!item||typeof item!=='object'||Array.isArray(item))throw new AppError('invalid_'+label,'Check the '+label.replaceAll('_',' ')+'.');
  const id=typeof item.id==='string'&&/^[\w-]{1,64}$/.test(item.id)?item.id:'item_'+(index+1);
  if(seen.has(id))throw new AppError('invalid_'+label,'Use unique '+label.replaceAll('_',' ')+' identifiers.');
  seen.add(id);
  return {id,label:shortText(item.label||'','rubric_label',300),required:item.required!==false};
 });
}
function materialList(value){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>10)throw new AppError('invalid_materials','List up to 10 materials.');
 return value.map(item=>shortText(item,'material',300));
}
async function assignmentDetail(env,row){
 const criteria=JSON.parse(row.criteria_json),prep=JSON.parse(row.prep_json),done=new Set(JSON.parse(row.prep_done_json||'[]'));
 const decisions=(await env.DB.prepare('SELECT * FROM professional_criterion_decisions WHERE assignment_id=? ORDER BY created_at,id').bind(row.id).all()).results;
 const latest={};for(const item of decisions)latest[item.criterion_id]=item;
 const enrollment=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(row.enrollment_id).first();
 const detail=enrollment?await proDetail(env,enrollment):null;
 const account=await env.DB.prepare('SELECT display_name FROM learner_accounts WHERE id=?').bind(row.owner_id).first();
 return {id:row.id,enrollment_id:row.enrollment_id,owner_id:row.owner_id,learner_name:account?.display_name||null,course_id:enrollment?.course_id||null,brief:{title:row.brief_title,outcome:row.brief_outcome,materials:JSON.parse(row.materials_json)},rubric_version:1,criteria:criteria.map(item=>({...item,latest_decision:latest[item.id]?{decision:latest[item.id].decision,notes:latest[item.id].notes,reviewer_id:latest[item.id].reviewer_id,created_at:latest[item.id].created_at}:null})),preparation:prep.map(item=>({...item,done:done.has(item.id)})),status:row.status,version:row.version,practice_complete:!!detail?.practice_complete,created_at:row.created_at,updated_at:row.updated_at,decisions:decisions.map(item=>({id:item.id,criterion_id:item.criterion_id,decision:item.decision,notes:item.notes,reviewer_id:item.reviewer_id,assignment_version:item.assignment_version,created_at:item.created_at}))};
}
async function ownedAssignment(env,id,user){
 const row=await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(id).first();
 if(!row||row.owner_id!==user.id)throw new AppError('assignment_not_found','This assignment is not available to your account.',404);
 return row;
}
export async function routeProfessional(request,env,url){
 const path=url.pathname.replace(/\/$/,''),method=request.method;
 if(!path.startsWith('/v1/professional'))return null;
 if(method!=='GET'&&request.headers.get('origin')!==url.origin)throw new AppError('origin_denied','Use this action from the professional app.',403);
 if(path==='/v1/professional/courses'&&method==='GET')return json({courses:PRO_CATALOGUE.courses.map(course=>({...course,lessons:course.lesson_ids.map(id=>{const lesson=PRO_CATALOGUE.lessons.find(item=>item.id===id);return {id,title:lesson.title,steps:lesson.steps.length};})}))});
 const user=accountRequired(await requestUser(request));await ensureAccount(env,user);
 const evidence=await routeProEvidence(request,env,url,user);if(evidence)return evidence;
 const intake=await routeProRequests(request,env,url,user);if(intake)return intake;
 if(path==='/v1/professional/assignments'&&method==='GET'){
  let rows;
  try{adminRequired(env,user);rows=(await env.DB.prepare('SELECT * FROM professional_assignments ORDER BY updated_at DESC,id').all()).results;}
  catch{rows=(await env.DB.prepare('SELECT * FROM professional_assignments WHERE owner_id=? ORDER BY updated_at DESC,id').bind(user.id).all()).results;}
  return json({assignments:await Promise.all(rows.map(row=>assignmentDetail(env,row)))});
 }
 if(path==='/v1/professional/assignments'&&method==='POST'){
  adminRequired(env,user);const body=await bodyJSON(request);
  const enrollment=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(body.enrollment_id).first();
  if(!enrollment)throw new AppError('enrollment_not_found','Choose a learner enrollment.',404);
  if(enrollment.owner_id===user.id)throw new AppError('self_assignment_denied','An instructor cannot assign their own training.',403);
  if(await env.DB.prepare('SELECT id FROM professional_assignments WHERE enrollment_id=?').bind(enrollment.id).first())throw new AppError('assignment_exists','This enrollment already has an assignment.',409);
  const title=shortText(body.brief_title||'','brief_title',200),outcome=shortText(body.brief_outcome||'','brief_outcome',1200),materials=materialList(body.materials),criteria=rubricList(body.criteria,'criteria'),prep=rubricList(body.prep_checks,'prep_checks');
  const id=sid('assignment'),now=Date.now();
  await env.DB.prepare('INSERT INTO professional_assignments(id,enrollment_id,owner_id,created_by,brief_title,brief_outcome,materials_json,criteria_json,prep_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,enrollment.id,enrollment.owner_id,user.id,title,outcome,JSON.stringify(materials),JSON.stringify(criteria),JSON.stringify(prep),now,now).run();
  return json(await assignmentDetail(env,await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(id).first()),201);
 }
 const assignmentMatch=path.match(/^\/v1\/professional\/assignments\/([\w-]+)(?:\/(preparation|submit|assess))?$/);
 if(assignmentMatch){
  const assignmentID=assignmentMatch[1],assignmentAction=assignmentMatch[2];
  if(!assignmentAction&&method==='GET'){
   const row=await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(assignmentID).first();
   if(!row)throw new AppError('assignment_not_found','Assignment unavailable.',404);
   if(row.owner_id!==user.id){
    if(!isAdmin(env,user))throw new AppError('assignment_not_found','Assignment unavailable.',404);
    const enrollment=await env.DB.prepare('SELECT evidence_shared FROM professional_enrollments WHERE id=?').bind(row.enrollment_id).first();
    if(!['submitted','changes_requested','approved'].includes(row.status)&&!enrollment?.evidence_shared)throw new AppError('assignment_not_found','Assignment unavailable.',404);
   }
   return json(await assignmentDetail(env,row));
  }
  if(assignmentAction==='preparation'&&method==='POST'){
   const row=await ownedAssignment(env,assignmentID,user),body=await bodyJSON(request);
   if(!Number.isSafeInteger(body.expected_version)||body.expected_version!==row.version)throw new AppError('assignment_conflict','Refresh this assignment before continuing.',409);
   if(!['preparation','practice'].includes(row.status))throw new AppError('assignment_locked','Preparation is closed for this assignment.',409);
   const prep=JSON.parse(row.prep_json),ids=new Set(prep.map(item=>item.id));
   if(!Array.isArray(body.done)||body.done.some(item=>typeof item!=='string'||!ids.has(item)))throw new AppError('invalid_preparation','Complete preparation items from this brief.');
   const done=[...new Set(body.done)],status=prep.filter(item=>item.required).every(item=>done.includes(item.id))&&row.status==='preparation'?'practice':row.status,now=Date.now();
   const result=await env.DB.prepare('UPDATE professional_assignments SET prep_done_json=?,status=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(done),status,now,row.id,row.version).run();
   if(!changed(result))throw new AppError('assignment_conflict','Refresh this assignment before continuing.',409);
   return json(await assignmentDetail(env,await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(row.id).first()));
  }
  if(assignmentAction==='submit'&&method==='POST'){
   const row=await ownedAssignment(env,assignmentID,user),body=await bodyJSON(request);
   if(!Number.isSafeInteger(body.expected_version)||body.expected_version!==row.version)throw new AppError('assignment_conflict','Refresh this assignment before submitting.',409);
   if(!['preparation','practice','changes_requested'].includes(row.status))throw new AppError('assignment_locked','This assignment is not open for submission.',409);
   const requiredPrep=JSON.parse(row.prep_json).filter(item=>item.required),donePrep=new Set(JSON.parse(row.prep_done_json||'[]'));
   if(requiredPrep.some(item=>!donePrep.has(item.id)))throw new AppError('preparation_incomplete','Complete every required preparation check before submitting.',409);
   if(body.share_evidence!==true)throw new AppError('sharing_required','Confirm that submitting shares your course evidence with instructors for this assessment.');
   const enrollment=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(row.enrollment_id).first();
   if(!enrollment||!(await proDetail(env,enrollment)).practice_complete)throw new AppError('practice_incomplete','Finish all course practice before submitting evidence.',409);
   const now=Date.now(),result=await env.DB.prepare("UPDATE professional_assignments SET status='submitted',version=version+1,updated_at=? WHERE id=? AND version=?").bind(now,row.id,row.version).run();
   if(!changed(result))throw new AppError('assignment_conflict','Refresh this assignment before submitting.',409);
   await env.DB.prepare('UPDATE professional_enrollments SET evidence_shared=1,updated_at=? WHERE id=?').bind(now,row.enrollment_id).run();
   return json(await assignmentDetail(env,await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(row.id).first()));
  }
  if(assignmentAction==='assess'&&method==='POST'){
   adminRequired(env,user);const body=await bodyJSON(request);
   const row=await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(assignmentID).first();
   if(!row)throw new AppError('assignment_not_found','Assignment unavailable.',404);
   if(row.owner_id===user.id)throw new AppError('self_approval_denied','An instructor cannot assess their own training.',403);
   if(!Number.isSafeInteger(body.expected_version)||body.expected_version!==row.version)throw new AppError('assignment_conflict','The assignment changed. Reload before assessing.',409);
   if(row.status!=='submitted')throw new AppError('assignment_not_submitted','Only a submitted assignment can be assessed.',409);
   const criteria=JSON.parse(row.criteria_json),criterion=criteria.find(item=>item.id===body.criterion_id);
   if(!criterion)throw new AppError('invalid_criterion','Choose a criterion from this assignment rubric.');
   if(!['approved','changes_requested'].includes(body.decision))throw new AppError('invalid_decision','Approve this criterion or request changes.');
   const notes=shortText(body.notes??'','assessment_notes',2000,false);
   if(body.decision==='changes_requested'&&!notes)throw new AppError('notes_required','Explain what must change for this criterion.');
   const decisions=(await env.DB.prepare('SELECT * FROM professional_criterion_decisions WHERE assignment_id=? ORDER BY created_at,id').bind(row.id).all()).results,latest={};
   for(const item of decisions)latest[item.criterion_id]=item.decision;
   latest[criterion.id]=body.decision;
   const status=body.decision==='changes_requested'?'changes_requested':criteria.filter(item=>item.required).every(item=>latest[item.id]==='approved')?'approved':'submitted',now=Date.now(),decisionID=sid('criterion_decision');
   // Decision and resulting status commit together or not at all: the insert
   // only lands while the assignment is still at the assessed version, and
   // the status update only lands if that decision row exists.
   const results=await env.DB.batch([
    env.DB.prepare("INSERT INTO professional_criterion_decisions(id,assignment_id,criterion_id,decision,notes,reviewer_id,assignment_version,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM professional_assignments WHERE id=? AND status='submitted' AND version=?)").bind(decisionID,row.id,criterion.id,body.decision,notes,user.id,row.version,now,row.id,row.version),
    env.DB.prepare('UPDATE professional_assignments SET status=?,version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM professional_criterion_decisions WHERE id=?)').bind(status,now,row.id,row.version,decisionID)
   ]);
   if(!changed(results[0])||!changed(results[1]))throw new AppError('assignment_conflict','The assignment changed. Reload before assessing.',409);
   return json(await assignmentDetail(env,await env.DB.prepare('SELECT * FROM professional_assignments WHERE id=?').bind(row.id).first()));
  }
  throw new AppError('method_not_allowed','Use an available assignment action.',405);
 }
 if(path==='/v1/professional/enrollments'&&method==='GET'){
  const rows=(await env.DB.prepare('SELECT * FROM professional_enrollments WHERE owner_id=? ORDER BY updated_at DESC,id').bind(user.id).all()).results;
  return json({enrollments:await Promise.all(rows.map(row=>proDetail(env,row)))});
 }
 if(path==='/v1/professional/enrollments'&&method==='POST'){
  const body=await bodyJSON(request),course=proCourse(body.course_id);
  if(body.training_only!==true)throw new AppError('training_scope_required','Confirm classroom or disconnected training only.');
  const id='enrollment_'+await digest(JSON.stringify([user.id,course.id])),now=Date.now();
  await env.DB.prepare('INSERT OR IGNORE INTO professional_enrollments(id,owner_id,course_id,created_at,updated_at) VALUES(?,?,?,?,?)').bind(id,user.id,course.id,now,now).run();
  return json(await proDetail(env,await proEnrollment(env,id,user)),201);
 }
 if(path==='/v1/professional/review-queue'&&method==='GET'){
  adminRequired(env,user);
  const rows=(await env.DB.prepare("SELECT e.*,a.display_name AS learner_name FROM professional_enrollments e JOIN learner_accounts a ON a.id=e.owner_id WHERE e.status='pending_review' ORDER BY e.updated_at,e.id LIMIT 100").all()).results;
  return json({enrollments:await Promise.all(rows.filter(row=>row.owner_id!==user.id).map(row=>proDetail(env,row)))});
 }
 let match=path.match(/^\/v1\/professional\/enrollments\/([\w-]+)(?:\/(start|request-review|review))?$/);
 if(!match)throw new AppError('route_not_found','Professional route unavailable.',404);
 const id=match[1],action=match[2];
 if(action==='review'&&method==='POST'){
  adminRequired(env,user);const body=await bodyJSON(request);
  if(!['changes_requested','instructor_approved'].includes(body.decision))throw new AppError('invalid_decision','Choose approval or request changes.');
  const notes=shortText(body.notes,'review_notes',2000);
  if(!Number.isSafeInteger(body.expected_version))throw new AppError('invalid_version','Reload the review queue.');
  const row=await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(id).first();
  if(!row)throw new AppError('enrollment_not_found','Enrollment unavailable.',404);
  if(row.owner_id===user.id)throw new AppError('self_approval_denied','An instructor cannot review their own training.',403);
  const linkedAssignment=await env.DB.prepare('SELECT status FROM professional_assignments WHERE enrollment_id=?').bind(id).first();
  if(linkedAssignment&&linkedAssignment.status!=='approved')throw new AppError('assignment_incomplete','This enrollment has a professional assignment. Complete its instructor assessment before a course review decision.',409);
  if(row.status!=='pending_review'||row.version!==body.expected_version)throw new AppError('review_conflict','The review changed. Reload the queue.',409);
  if(await env.DB.prepare("SELECT id FROM professional_evidence WHERE enrollment_id=? AND status='uploading' LIMIT 1").bind(id).first())throw new AppError('evidence_busy','Wait for the evidence upload to finish before requesting review.',409);
  if(!(await proDetail(env,row)).practice_complete)throw new AppError('practice_incomplete','All lesson practice must be complete before review.',409);
  const reviewID=sid('review'),now=Date.now();
  const results=await env.DB.batch([
   env.DB.prepare("INSERT INTO professional_reviews(id,enrollment_id,reviewer_id,decision,notes,reviewed_version,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM professional_enrollments WHERE id=? AND status='pending_review' AND version=?) ON CONFLICT(enrollment_id,reviewed_version) DO NOTHING").bind(reviewID,id,user.id,body.decision,notes,body.expected_version,now,id,body.expected_version),
   env.DB.prepare('UPDATE professional_enrollments SET status=?,version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM professional_reviews WHERE id=?)').bind(body.decision,now,id,body.expected_version,reviewID)
  ]);
  if(!changed(results[0]))throw new AppError('review_conflict','Another instructor reviewed this request. Reload.',409);
  return json(await proDetail(env,await env.DB.prepare('SELECT * FROM professional_enrollments WHERE id=?').bind(id).first()));
 }
 const row=await proEnrollment(env,id,user);
 if(!action&&method==='GET')return json(await proDetail(env,row));
 if(action==='start'&&method==='POST'){
  const body=await bodyJSON(request),course=proCourse(row.course_id);
  if(!course.lesson_ids.includes(body.lesson_id))throw new AppError('lesson_not_in_course','Choose a lesson from this course.');
  const at=course.lesson_ids.indexOf(body.lesson_id),detail=await proDetail(env,row);
  if(at>0&&detail.lessons[at-1].completed_steps!==detail.lessons[at-1].total_steps)throw new AppError('prerequisite_incomplete','Finish the previous lesson practice first.',409);
  const sessionID=await proSessionID(user.id,course.id,body.lesson_id),lesson=PRO_CATALOGUE.lessons.find(item=>item.id===body.lesson_id),now=Date.now();
  await env.DB.prepare('INSERT OR IGNORE INTO practice_sessions(id,lesson_id,token_hash,created_at,updated_at,owner_id,total_steps) VALUES(?,?,?,?,?,?,?)').bind(sessionID,lesson.id,await digest(crypto.randomUUID()),now,now,user.id,lesson.steps.length).run();
  return json({session_id:sessionID,lesson_id:lesson.id,href:'/professional/lesson/runtime/play/?'+new URLSearchParams({lesson_id:lesson.id,session_id:sessionID})});
 }
 if(action==='request-review'&&method==='POST'){
  const body=await bodyJSON(request);if(!Number.isSafeInteger(body.expected_version)||body.expected_version!==row.version)throw new AppError('review_conflict','Refresh your course before requesting review.',409);
  if(await env.DB.prepare("SELECT id FROM professional_evidence WHERE enrollment_id=? AND status='uploading' LIMIT 1").bind(id).first())throw new AppError('evidence_busy','Wait for the evidence upload to finish before requesting review.',409);
  if(!(await proDetail(env,row)).practice_complete)throw new AppError('practice_incomplete','Finish all course lessons before requesting review.',409);
  if(body.share_evidence!==undefined&&typeof body.share_evidence!=='boolean')throw new AppError('invalid_sharing','Choose whether to share evidence with your instructor.');
  if(row.status==='pending_review'||row.status==='instructor_approved')return json(await proDetail(env,row));
  const result=await env.DB.prepare("UPDATE professional_enrollments SET status='pending_review',evidence_shared=?,version=version+1,updated_at=? WHERE id=? AND version=? AND NOT EXISTS(SELECT 1 FROM professional_evidence WHERE enrollment_id=professional_enrollments.id AND status='uploading')").bind(body.share_evidence===true?1:0,Date.now(),id,row.version).run();
  if(!changed(result))throw new AppError('review_conflict','Course changed. Refresh before continuing.',409);
  return json(await proDetail(env,await proEnrollment(env,id,user)));
 }
 throw new AppError('method_not_allowed','Use an available course action.',405);
}
