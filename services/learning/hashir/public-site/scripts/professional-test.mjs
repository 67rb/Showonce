/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localDB,localBucket} from './d1-local.mjs';
const worker=(await import('data:text/javascript;base64,'+Buffer.from(await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8')).toString('base64'))).default;
function fixture(){const env={DB:localDB(),BUCKET:localBucket(),ADMIN_EMAILS:'["teacher@example.test"]'};return {env,close:()=>env.DB.close(),call:(path,body,user='learner',method=body===undefined?'GET':'POST')=>{const headers=new Headers({Origin:'https://pro.test'});if(user){headers.set('oai-authenticated-user-id',user);headers.set('oai-authenticated-user-email',user==='teacher'?'teacher@example.test':user+'@example.test');}if(body!==undefined)headers.set('Content-Type','application/json');if(path.endsWith('/acknowledgements'))headers.set('Idempotency-Key',crypto.randomUUID());return worker.fetch(new Request('https://pro.test'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env);}};}
async function enroll(f,user='learner',course='plumbing'){const r=await f.call('/v1/professional/enrollments',{course_id:course,training_only:true},user);assert.equal(r.status,201);return r.json();}
async function finish(f,entry,user='learner'){for(const lesson of entry.lessons){const response=await f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:lesson.id},user);assert.equal(response.status,200);const s=await response.json(),l=await(await f.call('/v1/lessons/'+lesson.id,undefined,user)).json();for(const step of l.steps){const ack=await f.call('/v1/sessions/'+s.session_id+'/acknowledgements',{step_id:step.id,observations:[step.assessment_criteria[0]]},user);assert.equal(ack.status,200);}}return (await f.call('/v1/professional/enrollments/'+entry.id,undefined,user)).json();}
async function requestReview(f,entry,user='learner'){const r=await f.call('/v1/professional/enrollments/'+entry.id+'/request-review',{expected_version:entry.version},user);assert.equal(r.status,200);return r.json();}
test('catalogue offers trade courses and legacy courses URL opens the integrated UI',async()=>{const f=fixture();try{const c=await(await f.call('/v1/professional/courses',undefined,null)).json();assert.deepEqual(c.courses.map(x=>x.trade),['Plumbing','Electrical','Carpentry','Maintenance']);assert.ok(c.courses.every(x=>x.lessons.length===2&&x.training_only));const redirect=await f.call('/courses/',undefined,null);assert.equal(redirect.status,302);assert.equal(new URL(redirect.headers.get('location')).pathname,'/professional/lessons/');const config=await(await f.call('/api/config',undefined,null)).json();assert.equal(config.budget.limit_usd,5);}finally{f.close();}});
test('enrollment requires account, known course, explicit training scope and same origin',async()=>{const f=fixture();try{assert.equal((await f.call('/v1/professional/enrollments',{course_id:'plumbing',training_only:true},null)).status,401);assert.equal((await f.call('/v1/professional/enrollments',{course_id:'missing',training_only:true})).status,404);assert.equal((await f.call('/v1/professional/enrollments',{course_id:'plumbing'})).status,422);const response=await worker.fetch(new Request('https://pro.test/v1/professional/enrollments',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:'{}'}),f.env);assert.equal(response.status,403);}finally{f.close();}});
test('enrollment and lesson starts are replay-safe, ordered and account-private',async()=>{const f=fixture();try{const entry=await enroll(f);assert.equal((await enroll(f)).id,entry.id);assert.equal((await f.call('/v1/professional/enrollments/'+entry.id,undefined,'other')).status,404);assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:entry.lessons[1].id})).status,409);assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:'pro_electrical_symbols'})).status,422);const [a,b]=await Promise.all([f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:entry.lessons[0].id}),f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:entry.lessons[0].id})]);const sa=await a.json(),sb=await b.json();assert.equal(sa.session_id,sb.session_id);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS n FROM practice_sessions').first()).n,1);assert.equal((await f.call('/v1/sessions/'+sa.session_id,undefined,'other')).status,401);}finally{f.close();}});
test('free course practice saves across sessions without AI or automatic instructor approval',async()=>{const f=fixture(),original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No provider calls allowed');};try{let entry=await enroll(f);assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/request-review',{expected_version:1})).status,409);entry=await finish(f,entry);assert.equal(entry.practice_complete,true);assert.equal(entry.status,'learning');assert.equal(entry.qualification,false);const saved=(await(await f.call('/v1/professional/enrollments')).json()).enrollments[0];assert.equal(saved.lessons[0].completed_steps,3);assert.equal(saved.lessons[1].completed_steps,3);const pending=await requestReview(f,saved);assert.equal(pending.status,'pending_review');assert.equal(calls,0);assert.equal((await(await f.call('/api/config')).json()).budget.calls,0);}finally{globalThis.fetch=original;f.close();}});
test('review requires instructor authorization, rejects self-approval and uses version concurrency',async()=>{const f=fixture();try{let entry=await finish(f,await enroll(f));entry=await requestReview(f,entry);assert.equal((await f.call('/v1/professional/review-queue')).status,403);assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/review',{decision:'instructor_approved',notes:'Observed classroom work',expected_version:entry.version})).status,403);const queue=await(await f.call('/v1/professional/review-queue',undefined,'teacher')).json();assert.equal(queue.enrollments[0].id,entry.id);const review={decision:'instructor_approved',notes:'Observed the worksheet and discussed outstanding questions.',expected_version:entry.version};const results=await Promise.all([f.call('/v1/professional/enrollments/'+entry.id+'/review',review,'teacher'),f.call('/v1/professional/enrollments/'+entry.id+'/review',review,'teacher')]);assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);const saved=await(await f.call('/v1/professional/enrollments/'+entry.id)).json();assert.equal(saved.status,'instructor_approved');assert.equal(saved.reviews.length,1);assert.equal(saved.qualification,false);let own=await finish(f,await enroll(f,'teacher'),'teacher');own=await requestReview(f,own,'teacher');assert.equal((await f.call('/v1/professional/enrollments/'+own.id+'/review',{...review,expected_version:own.version},'teacher')).status,403);}finally{f.close();}});
test('requested changes preserve review history through resubmission and later approval',async()=>{const f=fixture();try{let entry=await requestReview(f,await finish(f,await enroll(f)));const path='/v1/professional/enrollments/'+entry.id;let response=await f.call(path+'/review',{decision:'changes_requested',notes:'Discuss and clarify the missing references.',expected_version:entry.version},'teacher');assert.equal(response.status,200);entry=await response.json();assert.equal(entry.status,'changes_requested');assert.equal((await f.call(path+'/request-review',{expected_version:1})).status,409);entry=await requestReview(f,entry);response=await f.call(path+'/review',{decision:'instructor_approved',notes:'Reviewed corrected worksheet with learner.',expected_version:entry.version},'teacher');assert.equal(response.status,200);entry=await response.json();assert.equal(entry.reviews.length,2);assert.equal(entry.status,'instructor_approved');}finally{f.close();}});

test('local professional database and private photos survive a restart without reapplying migrations',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');
 const {professionalLocalDB,professionalLocalBucket}=await import('./professional-local-store.mjs');const directory=await mkdtemp(join(tmpdir(),'showonce-pro-'));let db;
 try{db=professionalLocalDB(directory);await db.prepare("INSERT INTO learner_accounts(id,email,display_name,created_at,updated_at) VALUES('saved','learner@example.test','Saved learner',1,1)").run();const bucket=professionalLocalBucket(directory);await bucket.put('../private/frame',new Uint8Array([1,2,3]));db.close();db=professionalLocalDB(directory);assert.equal((await db.prepare("SELECT display_name FROM learner_accounts WHERE id='saved'").first()).display_name,'Saved learner');assert.deepEqual([...((await professionalLocalBucket(directory).get('../private/frame')).body)],[1,2,3]);await bucket.delete('../private/frame');assert.equal(await bucket.get('../private/frame'),null);}finally{db?.close();await rm(directory,{recursive:true,force:true});}
});

async function saveRequest(f,body,user='learner',key='intake-one'){
 return worker.fetch(new Request('https://pro.test/v1/professional/requests',{method:'POST',headers:{Origin:'https://pro.test','Content-Type':'application/json','Idempotency-Key':key,'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:JSON.stringify(body)}),f.env);
}
const intakePhoto=await readFile(new URL('../web/fixtures/images/cup_01_correct.png',import.meta.url));
const intakeBody={goal:'Learn to identify plumbing components in my training photo',source_url:'https://origami.me/cup/',training_only:true,mime_type:'image/png',image_base64:intakePhoto.toString('base64')};
test('learning goal, reference link and photo save privately without any paid calls; replay and deletion work',async()=>{
 const f=fixture(),original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Saving must stay free');};try{
  const saved=await saveRequest(f,intakeBody);assert.equal(saved.status,201);const item=await saved.json();assert.equal(item.goal,intakeBody.goal);assert.equal(item.source_url,intakeBody.source_url);assert.equal(item.has_photo,true);assert.equal((await saveRequest(f,intakeBody)).status,200);assert.equal((await saveRequest(f,{...intakeBody,goal:'Different goal'})).status,409);
  const path='/v1/professional/requests/'+item.id;assert.equal((await f.call(path,undefined,'other')).status,404);assert.equal((await f.call(path+'/photo',undefined,'other')).status,404);const photo=await f.call(path+'/photo');assert.deepEqual(Buffer.from(await photo.arrayBuffer()),intakePhoto);
  assert.equal((await f.call(path+'/plan',{ai_consent:false})).status,422);assert.equal((await f.call(path+'/plan',{ai_consent:true})).status,503);assert.equal((await(await f.call(path)).json()).status,'draft');assert.equal(calls,0);
  assert.equal((await f.call(path+'/photo',undefined,'learner','DELETE')).status,204);assert.equal((await f.call(path+'/photo')).status,404);assert.equal((await(await f.call(path)).json()).has_photo,false);
 }finally{globalThis.fetch=original;f.close();}
});
test('request validation rejects missing goals, bad links and corrupt photos before storage or AI',async()=>{
 const f=fixture();try{for(const patch of [{goal:''},{source_url:'javascript:alert(1)'},{source_url:'https://user:password@example.com/'},{image_base64:'invalid'},{mime_type:'text/plain'},{training_only:false}])assert.equal((await saveRequest(f,{...intakeBody,...patch})).status,422);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS n FROM professional_requests').first()).n,0);}finally{f.close();}
});
test('AI plan sees the actual uploaded photo and goal, saves private practice and cannot charge twice',async()=>{
 const f=fixture(),original=globalThis.fetch,seen=[];f.env.MODEL_API_KEY='TEST_ONLY';globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);seen.push({url,body});if(String(url).endsWith('input_tokens'))return Response.json({input_tokens:1000});return Response.json({status:'completed',usage:{input_tokens:1000,output_tokens:1000},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({supported:true,reason:'',title:'Training worksheet review',materials:['Paper'],observations:['A triangular outline is visible; components are not identifiable.'],limitations:['A photo cannot establish safety.'],steps:[{title:'Record visible details',instructions:'Write down what is visible on the training worksheet.',expected_visual_result:'A notes sheet is visible.',assessment_criteria:['Notes are visible.']},{title:'Prepare instructor questions',instructions:'List the component details your instructor needs to clarify.',expected_visual_result:'A questions sheet is visible.',assessment_criteria:['Questions are visible.']}]})}]}]});};try{
  const saved=await(await saveRequest(f,{...intakeBody,source_url:null})).json(),path='/v1/professional/requests/'+saved.id+'/plan';const response=await f.call(path,{ai_consent:true});assert.equal(response.status,201);const result=await response.json();assert.equal(result.status,'ready');assert.ok(result.href.includes('session_id='));const request=seen.find(item=>!String(item.url).endsWith('input_tokens')).body;const content=request.input[1].content;assert.equal(content.find(item=>item.type==='input_image').image_url,'data:image/png;base64,'+intakeBody.image_base64);assert.ok(content.find(item=>item.type==='input_text').text.includes(intakeBody.goal));assert.ok(!JSON.stringify(request).includes('TEST_ONLY'));
  const before=seen.length;assert.equal((await f.call(path,{ai_consent:true})).status,200);assert.equal(seen.length,before);const sessionID=new URL('https://pro.test'+result.href).searchParams.get('session_id');assert.equal((await f.call('/v1/sessions/'+sessionID,undefined,'other')).status,401);assert.equal((await(await f.call('/api/config')).json()).budget.calls,1);
 }finally{globalThis.fetch=original;f.close();}
});

async function saveEvidence(f,entry,body,key='evidence-one',user='learner'){
 return worker.fetch(new Request('https://pro.test/v1/professional/enrollments/'+entry.id+'/evidence',{method:'POST',headers:{Origin:'https://pro.test','Content-Type':'application/json','Idempotency-Key':key,'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'},body:JSON.stringify(body)}),f.env);
}
test('AI plan input carries the structured brief metadata, not just the goal',async()=>{
 const f=fixture(),original=globalThis.fetch,seen=[];f.env.MODEL_API_KEY='TEST_ONLY';globalThis.fetch=async(url,options)=>{seen.push({url,body:JSON.parse(options.body)});if(String(url).endsWith('input_tokens'))return Response.json({input_tokens:100});return Response.json({status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({supported:true,reason:'',title:'Symbols worksheet',materials:['Paper'],observations:['Symbols are visible.'],limitations:['Photo evidence is limited.'],steps:[{title:'Label symbols',instructions:'Label each visible symbol.',expected_visual_result:'Labels are visible.',assessment_criteria:['Labels are visible.']},{title:'Explain symbols',instructions:'Explain each symbol for your instructor.',expected_visual_result:'Explanations are visible.',assessment_criteria:['Explanations are visible.']}]})}]}]});};try{
  const saved=await(await saveRequest(f,{goal:'Interpret training symbols',training_only:true,trade:'Electrical',experience_level:'some_experience',success_criteria:'Explain each symbol to my instructor',source_url:null})).json();
  const response=await f.call('/v1/professional/requests/'+saved.id+'/plan',{ai_consent:true});assert.equal(response.status,201);
  const request=seen.find(item=>!String(item.url).endsWith('input_tokens')).body;
  const text=request.input.flatMap(item=>item.content||[]).find(item=>item.type==='input_text').text;
  const data=JSON.parse(text.slice(text.indexOf('{')));
  assert.equal(data.goal,'Interpret training symbols');assert.equal(data.trade,'Electrical');assert.equal(data.experience_level,'some_experience');assert.equal(data.success_criteria,'Explain each symbol to my instructor');
 }finally{globalThis.fetch=original;f.close();}
});
test('simultaneous identical evidence saves store one record',async()=>{
 const f=fixture();try{const entry=await enroll(f),body={lesson_id:entry.lessons[0].id,notes:'Concurrent training record',mime_type:'image/png',image_base64:intakePhoto.toString('base64')};
  const [a,b]=await Promise.all([saveEvidence(f,entry,body,'concurrent-evidence'),saveEvidence(f,entry,body,'concurrent-evidence')]);
  assert.deepEqual([a.status,b.status].sort(),[200,201]);
  const first=await a.json(),second=await b.json();assert.equal(first.id,second.id);
  assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS n FROM professional_evidence WHERE enrollment_id=?').bind(entry.id).first()).n,1);
  assert.equal((await(await f.call('/v1/professional/enrollments/'+entry.id+'/evidence')).json()).evidence.length,1);
 }finally{f.close();}
});
test('structured brief fields persist, bind replay keys and reject unsupported values',async()=>{
 const f=fixture();try{const body={goal:'Interpret training symbols',training_only:true,trade:'Electrical',experience_level:'some_experience',success_criteria:'Explain each symbol to my instructor'};const response=await saveRequest(f,body);assert.equal(response.status,201);const item=await response.json();assert.equal(item.trade,body.trade);assert.equal(item.experience_level,body.experience_level);assert.equal(item.success_criteria,body.success_criteria);assert.equal((await saveRequest(f,{...body,trade:'Plumbing'})).status,409);assert.equal((await saveRequest(f,{...body,trade:'unknown'},'learner','bad-trade')).status,422);assert.equal((await saveRequest(f,{...body,experience_level:'expert-master'},'learner','bad-level')).status,422);}finally{f.close();}
});
test('free evidence saves photos and notes once, is private, and deleted replay cannot resurrect it',async()=>{
 const f=fixture(),original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No provider call allowed');};try{const entry=await enroll(f),path='/v1/professional/enrollments/'+entry.id+'/evidence',body={lesson_id:entry.lessons[0].id,notes:'Identified training components',mime_type:'image/png',image_base64:intakePhoto.toString('base64')};let response=await saveEvidence(f,entry,body);assert.equal(response.status,201);const item=await response.json();assert.equal((await saveEvidence(f,entry,body)).status,200);assert.equal((await saveEvidence(f,entry,{...body,notes:'Changed'})).status,409);assert.equal((await saveEvidence(f,entry,{...body,lesson_id:'wrong'},'bad-lesson')).status,422);for(const user of ['other','teacher']){assert.equal((await f.call(path,undefined,user)).status,404);assert.equal((await f.call('/v1/professional/evidence/'+item.id+'/photo',undefined,user)).status,404);}assert.deepEqual(Buffer.from(await(await f.call('/v1/professional/evidence/'+item.id+'/photo')).arrayBuffer()),intakePhoto);assert.equal((await f.call(path)).status,200);assert.equal((await(await f.call(path)).json()).evidence.length,1);assert.equal((await f.call('/v1/professional/evidence/'+item.id,undefined,'learner','DELETE')).status,204);assert.equal((await f.call('/v1/professional/evidence/'+item.id+'/photo')).status,404);assert.equal((await(await saveEvidence(f,entry,body)).json()).status,'deleted');assert.equal((await(await f.call(path)).json()).evidence.length,0);assert.equal(calls,0);}finally{globalThis.fetch=original;f.close();}
});
test('instructor evidence access requires explicit sharing, revocation invalidates stale decisions, and review locks new evidence',async()=>{
 const f=fixture();try{let entry=await enroll(f);const path='/v1/professional/enrollments/'+entry.id;await saveEvidence(f,entry,{lesson_id:entry.lessons[0].id,notes:'Worksheet notes'});entry=await finish(f,entry);let response=await f.call(path+'/request-review',{expected_version:entry.version,share_evidence:true});assert.equal(response.status,200);entry=await response.json();assert.equal((await f.call(path+'/evidence',undefined,'teacher')).status,200);assert.equal((await saveEvidence(f,entry,{lesson_id:entry.lessons[0].id,notes:'Late change'},'late')).status,409);assert.equal((await f.call(path+'/evidence-sharing',{shared:false})).status,200);assert.equal((await f.call(path+'/evidence',undefined,'teacher')).status,404);assert.equal((await f.call(path+'/review',{expected_version:entry.version,decision:'instructor_approved',notes:'Observed work'},'teacher')).status,409);}finally{f.close();}
});
test('failed evidence uploads retry with the original key and active uploads block review atomically',async()=>{
 const f=fixture();try{let entry=await enroll(f);const body={lesson_id:entry.lessons[0].id,notes:'Training record',mime_type:'image/png',image_base64:intakePhoto.toString('base64')},put=f.env.BUCKET.put;f.env.BUCKET.put=async()=>{throw Error('offline');};assert.equal((await saveEvidence(f,entry,body)).status,503);f.env.BUCKET.put=put;const response=await saveEvidence(f,entry,body);assert.equal(response.status,201);const item=await response.json();assert.equal(item.status,'ready');entry=await finish(f,entry);await f.env.DB.prepare("UPDATE professional_evidence SET status='uploading' WHERE id=?").bind(item.id).run();assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/request-review',{expected_version:entry.version})).status,409);assert.equal((await f.call('/v1/professional/evidence/'+item.id,undefined,'learner','DELETE')).status,409);}finally{f.close();}
});

// Unlike the synchronous SQLite fixture's default scheduling, real D1 calls can
// both finish an initial missing-row read before either request inserts.
function overlapEvidenceReads(f){
 const prepare=f.env.DB.prepare;let reads=0,release;const gate=new Promise(resolve=>release=resolve);
 f.env.DB.prepare=sql=>{
  const statement=prepare(sql);if(!sql.startsWith('SELECT * FROM professional_evidence WHERE enrollment_id=? AND request_key=?'))return statement;
  return {...statement,bind(...args){const bound=statement.bind(...args);return {...bound,async first(){const snapshot=await bound.first();if(reads<2){if(++reads===2)release();await gate;}return snapshot;}};}};
 };
 return ()=>{release();f.env.DB.prepare=prepare;};
}
test('overlapping identical evidence saves report busy instead of service failure and replay the one completed upload',{timeout:5000},async()=>{
 const f=fixture();let unblock=()=>{},releaseUpload=()=>{};
 try{
  const entry=await enroll(f),body={lesson_id:entry.lessons[0].id,notes:'Overlapping photo save',mime_type:'image/png',image_base64:intakePhoto.toString('base64')};unblock=overlapEvidenceReads(f);
  const put=f.env.BUCKET.put,gate=new Promise(resolve=>releaseUpload=resolve);let uploads=0;
  f.env.BUCKET.put=async(...args)=>{uploads++;await gate;return put(...args);};
  const save=()=>saveEvidence(f,entry,body,'overlapping-photo').then(response=>{if(response.status!==201)releaseUpload();return response;});
  const results=await Promise.all([save(),save()]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  const busy=await results.find(r=>r.status===409).json();assert.equal(busy.error.code,'evidence_busy');
  const saved=await results.find(r=>r.status===201).json();assert.equal(uploads,1);
  const replay=await saveEvidence(f,entry,body,'overlapping-photo');assert.equal(replay.status,200);assert.equal((await replay.json()).id,saved.id);assert.equal(uploads,1);
  assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS count FROM professional_evidence WHERE enrollment_id=?').bind(entry.id).first()).count,1);
 }finally{releaseUpload();unblock();f.close();}
});
test('overlapping different evidence with the same save key returns an idempotency conflict without overwriting the winner',{timeout:5000},async()=>{
 const f=fixture();let unblock=()=>{};
 try{
  const entry=await enroll(f),body={lesson_id:entry.lessons[0].id,notes:'First observation'};unblock=overlapEvidenceReads(f);
  const results=await Promise.all([saveEvidence(f,entry,body,'conflicting-save'),saveEvidence(f,entry,{...body,notes:'Different observation'},'conflicting-save')]);
  assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const saved=await results.find(r=>r.status===201).json(),conflict=await results.find(r=>r.status===409).json();assert.equal(conflict.error.code,'idempotency_conflict');
  const listed=await(await f.call('/v1/professional/enrollments/'+entry.id+'/evidence')).json();assert.equal(listed.evidence.length,1);assert.equal(listed.evidence[0].notes,saved.notes);
 }finally{unblock();f.close();}
});

test('combined Hobby and Professional practice share one private account library and the same free runtime allowance',async()=>{
 const f=fixture(),original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('Combining free modes must not call a paid provider');};
 try{
  const hobbyLesson=await f.call('/v1/lessons',{example_id:'example_draw-shading',save_to_account:true});assert.equal(hobbyLesson.status,201);const lesson=await hobbyLesson.json();
  const hobbyResponse=await f.call('/v1/sessions',{lesson_id:lesson.id,save_to_account:true});assert.equal(hobbyResponse.status,201);const hobby=await hobbyResponse.json();
  const enrollment=await enroll(f),professionalResponse=await f.call('/v1/professional/enrollments/'+enrollment.id+'/start',{lesson_id:enrollment.lessons[0].id});assert.equal(professionalResponse.status,200);const professional=await professionalResponse.json();
  const library=await(await f.call('/v1/library')).json();assert.ok(library.entries.some(e=>e.id===hobby.session_id));assert.ok(library.entries.some(e=>e.id===professional.session_id));
  const other=await(await f.call('/v1/library',undefined,'other')).json();assert.equal(other.entries.length,0);
  const config=await(await f.call('/api/config')).json();assert.equal(config.budget.limit_usd,5);assert.equal(config.budget.calls,0);assert.equal(config.budget.charged_or_reserved_usd,0);
 }finally{globalThis.fetch=original;f.close();}
});

const demoBrief={brief_title:'Mock plumbing rig: identify and explain',brief_outcome:'Learner labels every fitting on the paper diagram and explains the dry-fit order to an instructor.',materials:['Paper diagram','Disconnected mock fittings'],criteria:[{id:'fittings',label:'Fittings identified on the labelled diagram',required:true},{id:'order',label:'Dry-fit order explained in notes',required:true}],prep_checks:[{id:'worksheet',label:'Worksheet printed and named'},{id:'rig',label:'Disconnected mock rig confirmed - no live plumbing'}]};
async function createAssignment(f,entry){const r=await f.call('/v1/professional/assignments',{enrollment_id:entry.id,...demoBrief},'teacher');assert.equal(r.status,201);return r.json();}
test('assignment lifecycle: preparation gates submission, revision loop, criterion approval is the only pass',async()=>{
 const f=fixture();try{const entry=await enroll(f);
  assert.equal((await f.call('/v1/professional/assignments',{enrollment_id:entry.id,...demoBrief})).status,403);
  const assignment=await createAssignment(f,entry);assert.equal(assignment.status,'preparation');assert.equal(assignment.criteria.length,2);assert.equal(assignment.practice_complete,false);
  assert.equal((await f.call('/v1/professional/assignments',{enrollment_id:entry.id,...demoBrief},'teacher')).status,409);
  const base='/v1/professional/assignments/'+assignment.id;
  assert.equal((await f.call(base+'/submit',{expected_version:1,share_evidence:true})).status,409);
  let current=await(await f.call(base+'/preparation',{expected_version:1,done:['worksheet']})).json();assert.equal(current.status,'preparation');assert.equal(current.version,2);
  assert.equal((await f.call(base+'/preparation',{expected_version:1,done:['worksheet','rig']})).status,409);
  current=await(await f.call(base+'/preparation',{expected_version:2,done:['worksheet','rig']})).json();assert.equal(current.status,'practice');
  assert.equal((await f.call(base+'/submit',{expected_version:3,share_evidence:true})).status,409);
  await finish(f,entry);
  const ready=await saveEvidence(f,entry,{lesson_id:entry.lessons[0].id,criterion_id:'fittings',notes:'Labelled diagram worksheet',mime_type:'image/png',image_base64:intakePhoto.toString('base64')},'assignment-evidence');assert.equal(ready.status,201);assert.equal((await ready.json()).criterion_id,'fittings');
  assert.equal((await saveEvidence(f,entry,{lesson_id:entry.lessons[0].id,criterion_id:'not-in-rubric',notes:'Wrong link'},'assignment-evidence-bad')).status,422);
  assert.equal((await f.call(base,undefined,'other')).status,404);
  current=await(await f.call(base+'/submit',{expected_version:3,share_evidence:true})).json();assert.equal(current.status,'submitted');assert.equal((await f.call('/v1/professional/enrollments/'+entry.id+'/evidence',undefined,'teacher')).status,200);
  assert.equal((await f.call(base+'/assess',{criterion_id:'fittings',decision:'approved',notes:'Clear',expected_version:4})).status,403);
  assert.equal((await f.call(base+'/assess',{criterion_id:'fittings',decision:'changes_requested',expected_version:4},'teacher')).status,422);
  current=await(await f.call(base+'/assess',{criterion_id:'fittings',decision:'changes_requested',notes:'Label the stop valve too.',expected_version:4},'teacher')).json();assert.equal(current.status,'changes_requested');assert.equal(current.criteria[0].latest_decision.decision,'changes_requested');
  assert.equal((await saveEvidence(f,entry,{lesson_id:entry.lessons[0].id,criterion_id:'fittings',notes:'Stop valve labelled'},'assignment-evidence-2')).status,201);
  current=await(await f.call(base+'/submit',{expected_version:5,share_evidence:true})).json();assert.equal(current.status,'submitted');
  current=await(await f.call(base+'/assess',{criterion_id:'fittings',decision:'approved',notes:'Complete labelling.',expected_version:6},'teacher')).json();assert.equal(current.status,'submitted');
  current=await(await f.call(base+'/assess',{criterion_id:'order',decision:'approved',notes:'Order explained clearly.',expected_version:7},'teacher')).json();assert.equal(current.status,'approved');assert.equal(current.decisions.length,3);
  const enrollment=await(await f.call('/v1/professional/enrollments/'+entry.id)).json();assert.equal(enrollment.qualification,false);assert.notEqual(enrollment.status,'instructor_approved');
 }finally{f.close();}
});
test('the same lesson explores freely in Hobby but stays gated inside a Professional assignment',async()=>{
 const f=fixture();try{
  const lesson=await(await f.call('/v1/lessons/pro_plumbing_parts',undefined,'explorer')).json();
  const session=await(await f.call('/v1/sessions',{lesson_id:lesson.id},'explorer')).json();
  const hobbyCall=(path,body)=>worker.fetch(new Request('https://pro.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:'https://pro.test','Content-Type':'application/json',Authorization:'Bearer '+session.access_token,'Idempotency-Key':crypto.randomUUID()},body:body===undefined?undefined:JSON.stringify(body)}),f.env);
  for(const step of lesson.steps){const ack=await hobbyCall('/v1/sessions/'+session.session_id+'/acknowledgements',{step_id:step.id,observations:['Explored']});assert.equal(ack.status,200);}
  const hobby=await(await hobbyCall('/v1/sessions/'+session.session_id)).json();assert.equal(hobby.completed_step_ids.length,lesson.steps.length);assert.equal(hobby.current_step_id,null);
  assert.deepEqual((await(await f.call('/v1/professional/assignments',undefined,'explorer')).json()).assignments,[]);
  const entry=await enroll(f,'trainee'),assignment=await createAssignment(f,entry);
  const started=await(await f.call('/v1/professional/enrollments/'+entry.id+'/start',{lesson_id:lesson.id},'trainee')).json();
  for(const step of lesson.steps){assert.equal((await f.call('/v1/sessions/'+started.session_id+'/acknowledgements',{step_id:step.id,observations:['Practised']},'trainee')).status,200);}
  const gated=await(await f.call('/v1/professional/assignments/'+assignment.id,undefined,'trainee')).json();assert.equal(gated.status,'preparation');assert.equal(gated.criteria.every(item=>item.latest_decision===null),true);
  assert.equal((await f.call('/v1/professional/assignments/'+assignment.id+'/submit',{expected_version:1,share_evidence:true},'trainee')).status,409);
 }finally{f.close();}
});
test('an instructor cannot assign or assess their own training',async()=>{
 const f=fixture();try{const own=await enroll(f,'teacher');
  assert.equal((await f.call('/v1/professional/assignments',{enrollment_id:own.id,...demoBrief},'teacher')).status,403);
  const entry=await enroll(f),assignment=await createAssignment(f,entry);
  assert.equal((await f.call('/v1/professional/assignments/'+assignment.id+'/assess',{criterion_id:'fittings',decision:'approved',expected_version:1},'teacher')).status,409);
 }finally{f.close();}
});

test('a failed decision save leaves the assignment unapproved and retryable',async()=>{
 const f=fixture();try{const entry=await enroll(f),assignment=await createAssignment(f,entry),base='/v1/professional/assignments/'+assignment.id;
  await f.call(base+'/preparation',{expected_version:1,done:['worksheet','rig']});await finish(f,entry);
  let current=await(await f.call(base+'/submit',{expected_version:2,share_evidence:true})).json();assert.equal(current.status,'submitted');
  current=await(await f.call(base+'/assess',{criterion_id:'fittings',decision:'approved',notes:'Complete.',expected_version:3},'teacher')).json();assert.equal(current.status,'submitted');
  await f.env.DB.prepare("CREATE TRIGGER fail_decision_save BEFORE INSERT ON professional_criterion_decisions BEGIN SELECT RAISE(ABORT,'simulated save failure'); END").run();
  const failed=await f.call(base+'/assess',{criterion_id:'order',decision:'approved',notes:'Complete.',expected_version:4},'teacher');assert.ok(failed.status>=500);
  const after=await(await f.call(base)).json();assert.equal(after.status,'submitted');assert.equal(after.version,4);assert.equal(after.decisions.length,1);assert.equal(after.criteria.find(item=>item.id==='order').latest_decision,null);
  await f.env.DB.prepare('DROP TRIGGER fail_decision_save').run();
  current=await(await f.call(base+'/assess',{criterion_id:'order',decision:'approved',notes:'Complete.',expected_version:4},'teacher')).json();assert.equal(current.status,'approved');assert.equal(current.decisions.length,2);
 }finally{f.close();}
});
test('submission rechecks required preparation even if status says practice',async()=>{
 const f=fixture();try{const entry=await enroll(f),assignment=await createAssignment(f,entry),base='/v1/professional/assignments/'+assignment.id;
  await finish(f,entry);
  await f.env.DB.prepare("UPDATE professional_assignments SET status='practice',prep_done_json='[]' WHERE id=?").bind(assignment.id).run();
  const blocked=await f.call(base+'/submit',{expected_version:1,share_evidence:true});assert.equal(blocked.status,409);assert.equal((await blocked.json()).error.code,'preparation_incomplete');
  const after=await(await f.call(base)).json();assert.equal(after.status,'practice');
 }finally{f.close();}
});
test('optional preparation items do not block submission once required ones are done',async()=>{
 const f=fixture();try{const entry=await enroll(f,'trainee2');
  const created=await f.call('/v1/professional/assignments',{enrollment_id:entry.id,...demoBrief,prep_checks:[{id:'worksheet',label:'Worksheet printed',required:true},{id:'rig',label:'Disconnected rig photo (optional)',required:false}]},'teacher');assert.equal(created.status,201);const assignment=await created.json(),base='/v1/professional/assignments/'+assignment.id;
  const current=await(await f.call(base+'/preparation',{expected_version:1,done:['worksheet']},'trainee2')).json();assert.equal(current.status,'practice');
  await finish(f,entry,'trainee2');
  const submitted=await f.call(base+'/submit',{expected_version:2,share_evidence:true},'trainee2');assert.equal(submitted.status,200);assert.equal((await submitted.json()).status,'submitted');
 }finally{f.close();}
});
