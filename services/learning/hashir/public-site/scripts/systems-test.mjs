/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {localDB,localBucket} from './d1-local.mjs';
import {AppError,assessPhoto,assessmentResult,budgetSummary,cost,groundedLesson,metaJSON,providerJSON,reserve,settle} from '../src/core.mjs';

const built=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(built).toString('base64'))).default;
const png=(await readFile(new URL('../web/fixtures/images/cup_01_correct.png',import.meta.url))).toString('base64');
const code=(name,status)=>error=>error instanceof AppError&&error.code===name&&(status===undefined||error.status===status);
const generated={supported:true,reason:'',title:'Draw a circle',category:'drawing',difficulty:null,materials:['Paper'],limitations:['Visible details only'],steps:[{title:'Draw',instructions:'Draw a circle with a pencil.',expected_visual_result:'A circle is visible.',assessment_criteria:['A circle is visible'],visual_limits:['A photo cannot establish the paper strength.'],photo_assessable:true,source_quote:'Draw a circle with a pencil.'}]};
const raw={observations:['A circle is visible.'],feedback:'The outline matches.',corrections:[],requested_evidence:[],criteria:[{criterion:'A circle is visible',status:'supported',evidence:'A complete round outline is visible.'}]};
const modelOptions={instructions:'Controlled test',content:'Controlled source',schema:{type:'object'},name:'test',maxOutput:100};
const envelope=(value={},input=100,output=100)=>Response.json({status:'completed',usage:{input_tokens:input,output_tokens:output},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});

test('generated lessons reject non-string, oversized and undeclared fields at the local boundary',async()=>{
 const mutations=[v=>v.materials=[{}],v=>v.materials=[' '],v=>v.limitations=[1],v=>v.steps[0].instructions=123,v=>v.steps[0].visual_limits=[null],v=>v.steps[0].assessment_criteria=Array(11).fill('Check'),v=>v.title='a'.repeat(1201),v=>v.steps[0].confidence=1];
 for(const mutate of mutations){const value=structuredClone(generated);mutate(value);await assert.rejects(()=>groundedLesson(value,{text:'Draw a circle with a pencil.',origin:'test'}),code('invalid_lesson',502));}
 const unsupported={...generated,supported:false,reason:'This source is incomplete.',steps:[]};
 await assert.rejects(()=>groundedLesson(unsupported,{text:'A source'}),code('insufficient_source'));
});
test('photo outcomes cannot pass with malformed observations, evidence or extra model claims',()=>{
 const mutations=[v=>v.observations=[{}],v=>v.observations=[7],v=>v.observations=[' '],v=>v.criteria[0].evidence={},v=>v.criteria[0].evidence=' ',v=>v.feedback='a'.repeat(1201),v=>v.confidence=1,v=>Object.defineProperty(v,'__proto__',{enumerable:true,value:{claim:'extra'}}),v=>v.toString='extra'];
 for(const mutate of mutations){const value=structuredClone(raw);mutate(value);assert.throws(()=>assessmentResult(value,{id:'step',assessment_criteria:['A circle is visible']}),code('invalid_assessment',502));}
});
test('one reservation can be claimed concurrently or replayed without charging twice',async()=>{
 const db=localDB();try{await Promise.all(Array.from({length:8},()=>reserve(db,10000,'one-reservation')));assert.equal((await budgetSummary(db)).calls,1);assert.equal((await budgetSummary(db)).charged_or_reserved_usd,.01);await assert.rejects(()=>reserve(db,20000,'one-reservation'),code('budget_record_invalid'));assert.equal((await budgetSummary(db)).calls,1);}finally{db.close();}
});
test('settlement refunds exactly once across concurrent replays and rejects changed usage',async()=>{
 const db=localDB();try{const id=await reserve(db,10000);await Promise.all(Array.from({length:8},()=>settle(db,id,100,100)));const expected=cost(100,100)/1e6;assert.equal((await budgetSummary(db)).charged_or_reserved_usd,expected);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,0);await assert.rejects(()=>settle(db,id,101,100),code('budget_record_invalid'));assert.equal((await budgetSummary(db)).charged_or_reserved_usd,expected);}finally{db.close();}
});
test('a failed settlement transaction retains the full hold and can be recovered once',async()=>{
 const db=localDB(),batch=db.batch;try{const id=await reserve(db,10000);let fail=true;db.batch=rows=>{if(fail){fail=false;return batch([...rows,db.prepare('INSERT INTO missing_test_table(value) VALUES(1)')]);}return batch(rows);};await assert.rejects(()=>settle(db,id,100,100));assert.equal((await budgetSummary(db)).charged_or_reserved_usd,.01);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,.01);await settle(db,id,100,100);assert.equal((await budgetSummary(db)).charged_or_reserved_usd,cost(100,100)/1e6);}finally{db.close();}
});
test('a lost settlement reply cannot cause another refund when the operation is replayed',async()=>{
 const db=localDB(),batch=db.batch;try{const id=await reserve(db,10000);let fail=true;db.batch=async rows=>{const result=await batch(rows);if(fail){fail=false;throw new Error('Reply lost after commit');}return result;};await assert.rejects(()=>settle(db,id,100,100));await settle(db,id,100,100);assert.equal((await budgetSummary(db)).charged_or_reserved_usd,cost(100,100)/1e6);assert.equal((await budgetSummary(db)).calls,1);}finally{db.close();}
});
test('an overrun pause survives other in-flight settlements and blocks new provider requests',async()=>{
 const db=localDB(),original=globalThis.fetch;let outbound=0;try{const first=await reserve(db,10000),second=await reserve(db,10000);await assert.rejects(()=>settle(db,first,100,5000),code('usage_mismatch'));await settle(db,second,100,1);await settle(db,second,100,1);const summary=await budgetSummary(db);assert.equal(summary.paused,true);assert.equal(summary.remaining_usd,0);assert.equal(summary.charged_or_reserved_usd,35);await assert.rejects(()=>reserve(db,1),code('budget_paused'));globalThis.fetch=async()=>{outbound++;throw new Error('Must not be called');};await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},modelOptions),code('budget_paused'));assert.equal(outbound,0);}finally{globalThis.fetch=original;db.close();}
});
test('unreported or invalid token usage retains the full reservation',async()=>{
 const db=localDB();try{const id=await reserve(db,10000);for(const usage of [[undefined,100],[1.1,100],[-1,1],[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]])await assert.rejects(()=>settle(db,id,...usage),code('usage_unknown'));assert.equal((await budgetSummary(db)).charged_or_reserved_usd,.01);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,.01);}finally{db.close();}
});
test('provider response size is enforced while streaming, even with a false Content-Length',async()=>{
 let pulls=0,cancelled=false;const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(50001));},cancel(){cancelled=true;}});
 const response=new Response(stream,{headers:{'Content-Type':'application/json','Content-Length':'1'}});
 await assert.rejects(()=>providerJSON(response,AbortSignal.timeout(1000)),code('invalid_provider_response',502));assert.ok(pulls<8);assert.equal(cancelled,true);
});
test('a stalled provider body is cancelled at its deadline',async()=>{
 let cancelled=false;const controller=new AbortController();const response=new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'Content-Type':'application/json'}});
 const pending=providerJSON(response,controller.signal);controller.abort();await assert.rejects(()=>pending,code('provider_timeout',504));assert.equal(cancelled,true);
});
test('unreadable provider responses are sanitized and a charged request is never retried',async()=>{
 const db=localDB(),original=globalThis.fetch;let calls=0;try{globalThis.fetch=async url=>{calls++;return url.endsWith('input_tokens')?Response.json({input_tokens:100}):new Response('PRIVATE_DIAGNOSTIC',{headers:{'Content-Type':'application/json'}});};await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},modelOptions),e=>code('invalid_provider_response',502)(e)&&!e.message.includes('PRIVATE_DIAGNOSTIC'));assert.equal(calls,2);assert.equal((await budgetSummary(db)).calls,1);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,cost(1124,100)/1e6);}finally{globalThis.fetch=original;db.close();}
});
test('a provider outage is sanitized and retains its reservation without retry',async()=>{
 const db=localDB(),original=globalThis.fetch;let calls=0;try{globalThis.fetch=async url=>{calls++;if(url.endsWith('input_tokens'))return Response.json({input_tokens:100});throw new Error('SECRET_NETWORK_DIAGNOSTIC');};await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},modelOptions),code('provider_failure',502));assert.equal(calls,2);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,cost(1124,100)/1e6);}finally{globalThis.fetch=original;db.close();}
});
test('invalid structured output is charged according to usage but never returned as valid data',async()=>{
 const db=localDB(),original=globalThis.fetch;try{globalThis.fetch=async url=>url.endsWith('input_tokens')?Response.json({input_tokens:100}):envelope({value:7},100,100);await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},{...modelOptions,schema:{type:'object',properties:{value:{type:'string'}},required:['value'],additionalProperties:false}}),code('invalid_provider_response'));assert.equal((await budgetSummary(db)).charged_or_reserved_usd,cost(100,100)/1e6);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,0);}finally{globalThis.fetch=original;db.close();}
});
test('the additive migration preserves existing budget totals and saved sessions',async()=>{
 const db=new DatabaseSync(':memory:');try{for(const file of ['0000_public_ai.sql','0001_master_sessions.sql'])db.exec(await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8'));db.exec("INSERT INTO ai_budget(id,charged_micro,calls) VALUES(1,18808,4); INSERT INTO practice_sessions(id,lesson_id,token_hash,current_index,created_at,updated_at) VALUES('existing','lesson','hash',1,1,1)");await db.exec(await readFile(new URL('../drizzle/0002_runtime_reliability.sql',import.meta.url),'utf8'));const row=db.prepare('SELECT * FROM ai_budget WHERE id=1').get();assert.equal(row.charged_micro,18808);assert.equal(row.calls,4);assert.equal(row.paused,0);assert.equal(db.prepare("SELECT current_index FROM practice_sessions WHERE id='existing'").get().current_index,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ai_reservations').get().n,0);}finally{db.close();}
});

function fixture(){const env={DB:localDB(),BUCKET:localBucket(),MODEL_API_KEY:'TEST_ONLY'};const call=(path,body,token,key,method=body===undefined?'GET':'POST')=>worker.fetch(new Request('https://test.example'+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);return {env,call,close:()=>env.DB.close()};}
async function start(f){const result=await f.call('/v1/sessions',{lesson_id:'example_draw-shading'});assert.equal(result.status,201);const session=await result.json();return {session,path:'/v1/sessions/'+session.session_id,token:session.access_token,body:{session_id:session.session_id,lesson_id:session.lesson_id,step_id:session.current_step_id,submission_id:'frame_test',mime_type:'image/png',image_base64:png}};}
function provider(gate){let calls=0;const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(url.endsWith('input_tokens'))return Response.json({input_tokens:100});calls++;if(gate)await gate(calls);const text=JSON.parse(options.body).input[1].content[0].text,step=JSON.parse(text.slice(text.indexOf('{')));return envelope({...raw,criteria:step.assessment_criteria.map(criterion=>({criterion,status:'supported',evidence:'Controlled visible evidence.'}))});};return {calls:()=>calls,restore(){globalThis.fetch=original;}};}
function gate(){let release,entered;const waiting=new Promise(r=>release=r),ready=new Promise(r=>entered=r);return {ready,release,async run(){entered();await waiting;}};}
test('invalid source types and processing modes fail before any provider call',async()=>{
 const f=fixture(),p=provider();try{for(const body of [{processing_mode:'unrecognized',source_text:'A'.repeat(200)},{source_text:123,source_url:'https://origami.me/cup/'},{source_url:{}},{example_id:1}]){const r=await f.call('/v1/lessons',body);assert.equal(r.status,422);}assert.equal(p.calls(),0);assert.equal((await budgetSummary(f.env.DB)).calls,0);}finally{p.restore();f.close();}
});
test('camera access requires the owning session and the authoritative current checkpoint',async()=>{
 const f=fixture(),p=provider();try{const x=await start(f);for(const [body,token,status] of [[{...x.body,session_id:undefined},undefined,401],[x.body,undefined,401],[x.body,'wrong',401],[{...x.body,lesson_id:'wrong'},x.token,409],[{...x.body,step_id:'next-step'},x.token,409]])assert.equal((await f.call('/api/assess',body,token)).status,status);assert.equal(p.calls(),0);assert.equal((await budgetSummary(f.env.DB)).calls,0);}finally{p.restore();f.close();}
});
test('camera and photo requests reject incomplete image signatures before using AI',async()=>{
 const f=fixture(),p=provider();try{const x=await start(f),image_base64=Buffer.from([137,80,78,71]).toString('base64');assert.equal((await f.call('/api/assess',{...x.body,image_base64},x.token)).status,422);assert.equal((await f.call(x.path+'/submissions',{...x.body,image_base64},x.token,'bad-image')).status,422);assert.equal(p.calls(),0);assert.equal((await budgetSummary(f.env.DB)).calls,0);}finally{p.restore();f.close();}
});
test('concurrent camera requests and a photo check share a single paid slot per session',async()=>{
 const f=fixture(),g=gate(),p=provider(()=>g.run());try{const x=await start(f),pending=f.call('/api/assess',x.body,x.token);await g.ready;assert.equal((await f.call('/api/assess',x.body,x.token)).status,429);assert.equal((await f.call(x.path+'/submissions',x.body,x.token,'photo-while-live')).status,409);g.release();assert.equal((await pending).status,200);assert.equal(p.calls(),1);const progress=await(await f.call(x.path,undefined,x.token)).json();assert.equal(progress.completed_step_ids.length,0);assert.equal((await(await f.call(x.path+'/submissions',undefined,x.token)).json()).submissions.length,0);assert.equal((await(await f.call(x.path+'/usage',undefined,x.token)).json()).events.length,0);}finally{g.release();p.restore();f.close();}
});
test('a pending photo check blocks camera work before another model request',async()=>{
 const f=fixture(),g=gate(),p=provider(()=>g.run());try{const x=await start(f),pending=f.call(x.path+'/submissions',x.body,x.token,'photo-first');await g.ready;assert.equal((await f.call('/api/assess',x.body,x.token)).status,429);g.release();assert.equal((await pending).status,201);assert.equal(p.calls(),1);}finally{g.release();p.restore();f.close();}
});
test('independent sessions can request feedback concurrently',async()=>{
 const f=fixture(),p=provider();try{const a=await start(f),b=await start(f);const responses=await Promise.all([f.call('/api/assess',a.body,a.token),f.call('/api/assess',b.body,b.token)]);assert.deepEqual(responses.map(r=>r.status),[200,200]);assert.equal(p.calls(),2);}finally{p.restore();f.close();}
});
test('an acknowledgement cannot advance a checkpoint during a live check or waste its result',async()=>{
 const f=fixture(),g=gate(),p=provider(()=>g.run());try{const x=await start(f),pending=f.call('/api/assess',x.body,x.token);await g.ready;const ack=await f.call(x.path+'/acknowledgements',{step_id:x.body.step_id},x.token,'move-step');assert.equal(ack.status,409);assert.equal((await ack.json()).error.code,'assessment_in_progress');assert.equal((await(await f.call(x.path,undefined,x.token)).json()).completed_step_ids.length,0);g.release();assert.equal((await pending).status,200);assert.equal((await(await f.call(x.path,undefined,x.token)).json()).completed_step_ids.length,0);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS count FROM practice_camera_feedback WHERE session_id=?').bind(x.session.session_id).first()).count,1);assert.equal(p.calls(),1);}finally{g.release();p.restore();f.close();}
});
test('an active live lease blocks acknowledgement until it expires or is released',async()=>{
 const f=fixture();try{const x=await start(f),now=Date.now();await f.env.DB.prepare('INSERT INTO practice_live_leases(session_id,claim_id,created_at,expires_at,active) VALUES(?,?,?,?,1)').bind(x.session.session_id,'direct-lease',now,now+120000).run();const blocked=await f.call(x.path+'/acknowledgements',{step_id:x.body.step_id},x.token,'ack-live-blocked');assert.equal(blocked.status,409);assert.equal((await blocked.json()).error.code,'assessment_in_progress');assert.equal((await(await f.call(x.path,undefined,x.token)).json()).completed_step_ids.length,0);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS count FROM practice_acknowledgements WHERE session_id=?').bind(x.session.session_id).first()).count,0);await f.env.DB.prepare('UPDATE practice_live_leases SET expires_at=? WHERE session_id=?').bind(Date.now()-1,x.session.session_id).run();const allowed=await f.call(x.path+'/acknowledgements',{step_id:x.body.step_id},x.token,'ack-live-expired');assert.equal(allowed.status,200);assert.equal((await allowed.json()).progress.completed_step_ids.length,1);const y=await start(f),later=Date.now();await f.env.DB.prepare('INSERT INTO practice_live_leases(session_id,claim_id,created_at,expires_at,active) VALUES(?,?,?,?,1)').bind(y.session.session_id,'direct-lease-released',later,later+120000).run();await f.env.DB.prepare('UPDATE practice_live_leases SET active=0 WHERE session_id=?').bind(y.session.session_id).run();const released=await f.call(y.path+'/acknowledgements',{step_id:y.body.step_id},y.token,'ack-live-released');assert.equal(released.status,200);assert.equal((await released.json()).progress.completed_step_ids.length,1);}finally{f.close();}
});
test('a lease-blocked acknowledgement retries with the same key exactly once',async()=>{
 const f=fixture();try{const x=await start(f),now=Date.now();await f.env.DB.prepare('INSERT INTO practice_live_leases(session_id,claim_id,created_at,expires_at,active) VALUES(?,?,?,?,1)').bind(x.session.session_id,'retry-lease',now,now+120000).run();const body={step_id:x.body.step_id,observations:['Checked while the camera was busy.']};const blocked=await f.call(x.path+'/acknowledgements',body,x.token,'ack-lease-retry');assert.equal(blocked.status,409);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS count FROM practice_acknowledgements WHERE session_id=?').bind(x.session.session_id).first()).count,0);await f.env.DB.prepare('UPDATE practice_live_leases SET expires_at=? WHERE session_id=?').bind(Date.now()-1,x.session.session_id).run();const retried=await(await f.call(x.path+'/acknowledgements',body,x.token,'ack-lease-retry')).json();assert.equal(retried.replayed,false);assert.equal(retried.progress.completed_step_ids.length,1);assert.deepEqual(retried.progress.completed_checkpoints[0].observations,body.observations);const replay=await(await f.call(x.path+'/acknowledgements',body,x.token,'ack-lease-retry')).json();assert.equal(replay.replayed,true);assert.equal((await f.env.DB.prepare('SELECT COUNT(*) AS count FROM practice_acknowledgements WHERE session_id=?').bind(x.session.session_id).first()).count,1);}finally{f.close();}
});
test('the server enforces camera sampling cooldown and releases a completed lease',async()=>{
 const f=fixture(),p=provider();try{const x=await start(f);assert.equal((await f.call('/api/assess',x.body,x.token)).status,200);assert.equal((await f.call('/api/assess',x.body,x.token)).status,429);assert.equal(p.calls(),1);const row=await f.env.DB.prepare('SELECT active FROM practice_live_leases WHERE session_id=?').bind(x.session.session_id).first();assert.equal(row.active,0);await f.env.DB.prepare('UPDATE practice_live_leases SET created_at=? WHERE session_id=?').bind(Date.now()-3100,x.session.session_id).run();assert.equal((await f.call('/api/assess',x.body,x.token)).status,200);assert.equal(p.calls(),2);}finally{p.restore();f.close();}
});
test('an expired request cannot release a newer camera lease',async()=>{
 const f=fixture(),first=gate(),second=gate(),p=provider(n=>n===1?first.run():second.run());try{const x=await start(f),old=f.call('/api/assess',x.body,x.token);await first.ready;await f.env.DB.prepare('UPDATE practice_live_leases SET expires_at=? WHERE session_id=?').bind(Date.now()-1,x.session.session_id).run();const current=f.call('/api/assess',{...x.body,submission_id:'new-frame'},x.token);await second.ready;first.release();assert.equal((await old).status,409);assert.equal((await f.env.DB.prepare('SELECT active FROM practice_live_leases WHERE session_id=?').bind(x.session.session_id).first()).active,1);second.release();assert.equal((await current).status,200);}finally{first.release();second.release();p.restore();f.close();}
});
test('camera failure releases its lease and conservatively keeps uncertain usage',async()=>{
 const f=fixture(),original=globalThis.fetch;try{globalThis.fetch=async url=>url.endsWith('input_tokens')?Response.json({input_tokens:100}):new Response('PRIVATE_DIAGNOSTIC',{status:503});const x=await start(f);assert.equal((await f.call('/api/assess',x.body,x.token)).status,502);assert.equal((await f.env.DB.prepare('SELECT active FROM practice_live_leases WHERE session_id=?').bind(x.session.session_id).first()).active,0);assert.ok((await budgetSummary(f.env.DB)).unresolved_reservations_usd>0);}finally{globalThis.fetch=original;f.close();}
});
test('readiness fails for unavailable database or media bindings and succeeds with the migrated schema',async()=>{
 const f=fixture();try{const healthy=await f.call('/health');assert.equal(healthy.status,200);assert.equal((await healthy.json()).storage,'ready');assert.equal((await worker.fetch(new Request('https://test.example/health'),{})).status,503);assert.equal((await worker.fetch(new Request('https://test.example/health'),{DB:f.env.DB})).status,503);const prepare=f.env.DB.prepare;f.env.DB.prepare=()=>{throw new Error('PRIVATE_DATABASE_DIAGNOSTIC');};const failure=await f.call('/health');assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('PRIVATE_DATABASE_DIAGNOSTIC'));f.env.DB.prepare=prepare;}finally{f.close();}
});

test('readiness rejects the earlier schema until the new migration is present',async()=>{
 const db=new DatabaseSync(':memory:');try{for(const file of ['0000_public_ai.sql','0001_master_sessions.sql'])db.exec(await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8'));const DB={prepare(sql){const statement=db.prepare(sql);return {first:async()=>statement.get()};}};const result=await worker.fetch(new Request('https://test.example/health'),{DB,BUCKET:localBucket()});assert.equal(result.status,503);assert.equal((await result.json()).error.code,'service_unavailable');}finally{db.close();}
});

test('invalid token preflight is a provider error and cannot reserve generation credit',async()=>{
 const db=localDB(),original=globalThis.fetch;let calls=0;try{globalThis.fetch=async()=>{calls++;return Response.json({input_tokens:'not a count'});};await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},modelOptions),code('invalid_provider_response',502));assert.equal(calls,1);assert.equal((await budgetSummary(db)).calls,0);}finally{globalThis.fetch=original;db.close();}
});
test('readiness rejects a database missing the assignment migration or its criterion tables',async()=>{
 const migrations=new URL('../drizzle/',import.meta.url),files=(await readdir(migrations)).filter(name=>name.endsWith('.sql')).sort();
 for(const missing of ['0015_professional_assignments.sql','professional_criterion_decisions']){
  const db=new DatabaseSync(':memory:');try{
   for(const file of files){if(file===missing)continue;db.exec(await readFile(new URL(file,migrations),'utf8'));}
   if(!missing.endsWith('.sql'))db.exec('DROP TABLE '+missing);
   const DB={prepare(sql){const statement=db.prepare(sql);return {first:async()=>statement.get()};}};
   const result=await worker.fetch(new Request('https://test.example/health'),{DB,BUCKET:localBucket()});assert.equal(result.status,503);assert.equal((await result.json()).error.code,'service_unavailable');
  }finally{db.close();}
 }
});
test('rate limiting does not cause automatic retries and retains a post-reservation hold',async()=>{
 const db=localDB(),original=globalThis.fetch;let calls=0;try{globalThis.fetch=async url=>{calls++;return url.endsWith('input_tokens')?Response.json({input_tokens:100}):new Response('PRIVATE_RATE_DIAGNOSTIC',{status:429});};await assert.rejects(()=>metaJSON({DB:db,MODEL_API_KEY:'TEST_ONLY'},modelOptions),code('provider_rate_limited',429));assert.equal(calls,2);assert.equal((await budgetSummary(db)).unresolved_reservations_usd,cost(1124,100)/1e6);}finally{globalThis.fetch=original;db.close();}
});


test('picture checks send the selected image and authoritative step to vision, without provider keys in the prompt',async()=>{
 const DB=localDB(),original=globalThis.fetch,seen=[],secret='TEST_ONLY_PRIVATE',step={id:'visible_step',photo_assessable:true,assessment_criteria:['A circle is visible']};
 const images=[png,(await readFile(new URL('../web/fixtures/images/cup_01_mistake.png',import.meta.url))).toString('base64')];
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer '+secret);const payload=JSON.parse(options.body);seen.push(payload);return url.endsWith('/input_tokens')?Response.json({input_tokens:100}):envelope(raw);};
  for(const image_base64 of images){const result=await assessPhoto({DB,MODEL_API_KEY:secret},{lesson:{id:'lesson_current'},step,body:{mime_type:'image/png',image_base64,submission_id:'picture_test'}});assert.equal(result.provider,'meta');assert.equal(result.is_mock,false);assert.equal(result.step_id,step.id);}
  assert.equal(seen.length,4);for(let i=0;i<seen.length;i++){const content=seen[i].input[1].content;assert.equal(content.find(item=>item.type==='input_image').image_url,'data:image/png;base64,'+images[Math.floor(i/2)]);assert.ok(content.find(item=>item.type==='input_text').text.includes('visible_step'));assert.ok(!JSON.stringify(seen[i]).includes(secret));}assert.notEqual(images[0],images[1]);
 }finally{globalThis.fetch=original;DB.close();}
});

test('live checks are capped at 20 per session in 24 hours without calling the provider',async()=>{
 const f=fixture(),p=provider();try{const x=await start(f);const now=Date.now();for(let i=0;i<20;i++)await f.env.DB.prepare('INSERT INTO practice_camera_feedback(id,session_id,step_id,assessment,created_at) VALUES(?,?,?,?,?)').bind('seed_'+i,x.session.session_id,x.body.step_id,'{}',now-i).run();const response=await f.call('/api/assess',x.body,x.token);assert.equal(response.status,429);assert.equal((await response.json()).error.code,'live_check_limit');assert.equal(p.calls(),0);}finally{p.restore();f.close();}
});
test('the live cooldown measures from completion rather than start',async()=>{
 const f=fixture(),g=gate(),p=provider(()=>g.run());try{const x=await start(f),pending=f.call('/api/assess',x.body,x.token);await g.ready;await f.env.DB.prepare('UPDATE practice_live_leases SET created_at=? WHERE session_id=?').bind(Date.now()-10000,x.session.session_id).run();g.release();assert.equal((await pending).status,200);assert.equal((await f.call('/api/assess',x.body,x.token)).status,429);assert.equal(p.calls(),1);const row=await f.env.DB.prepare('SELECT active,created_at FROM practice_live_leases WHERE session_id=?').bind(x.session.session_id).first();assert.equal(row.active,0);assert.ok(Date.now()-row.created_at<3000);}finally{g.release();p.restore();f.close();}
});
