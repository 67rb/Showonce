/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_BUDGET_MICRO} from '../src/core.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {localDB,localBucket} from './d1-local.mjs';
const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const responseFor=value=>Response.json({status:'completed',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
const answer={answer:'Use a gentle, light pencil stroke for this practice.',basis:'general_explanation',source_quote:'',limitations:[]};
function fixture(){const env={DB:localDB(),BUCKET:localBucket(),MODEL_API_KEY:'TEST_ONLY_PRIVATE'};const call=(path,body,token,key,method=body===undefined?'GET':'POST',actor=null,origin='https://test.example')=>worker.fetch(new Request('https://test.example'+path,{method,headers:{...(origin?{Origin:origin}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{}),...(actor?{'oai-authenticated-user-id':actor,'oai-authenticated-user-email':actor+'@example.test'}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);return {env,call,close:()=>env.DB.close()};}
async function practice(f,actor=null,lessonID='example_draw-shading'){const session=await(await f.call('/v1/sessions',{lesson_id:lessonID,save_to_account:!!actor},null,null,'POST',actor)).json();const lesson=await(await f.call('/v1/lessons/'+lessonID,undefined,session.access_token,null,'GET',actor)).json();return {session,lesson,path:'/v1/sessions/'+session.session_id+'/questions',token:session.access_token,body:{step_id:lesson.steps[0].id,question:'Can you explain this instruction simply?'}};}
function provider({value=answer,gate,fail=false}={}){const original=globalThis.fetch,seen=[];let generations=0;globalThis.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer TEST_ONLY_PRIVATE');const body=JSON.parse(options.body);assert.ok(!JSON.stringify(body).includes('TEST_ONLY_PRIVATE'));seen.push(body);if(url.endsWith('/input_tokens'))return Response.json({input_tokens:100});generations++;if(gate)await gate();return fail?new Response('Private upstream diagnostic TEST_ONLY_PRIVATE',{status:503}):responseFor(value);};return {seen,generations:()=>generations,restore:()=>{globalThis.fetch=original;}};}
function hold(){let release,entered;const ready=new Promise(resolve=>entered=resolve),waiting=new Promise(resolve=>release=resolve);return {release,ready,wait:async()=>{entered();await waiting;}};}

test('step answers use server lesson context, save privately, replay once, and never change progress',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f);let response=await f.call(x.path,x.body,x.token,'question-one');assert.equal(response.status,201);const result=await response.json();assert.equal(result.record.answer.answer,answer.answer);assert.equal(result.record.request_key,'question-one');const context=JSON.parse(p.seen[0].input[1].content[0].text);assert.equal(context.step.id,x.body.step_id);assert.equal(context.step.instructions,x.lesson.steps[0].instructions);assert.equal(context.question,x.body.question);assert.deepEqual(p.seen[0].input[1].content.map(item=>item.type),['input_text']);
 response=await f.call(x.path,x.body,x.token,'question-one');assert.equal(response.status,200);assert.equal((await response.json()).replayed,true);assert.equal(p.generations(),1);const history=await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json();assert.equal(history.questions.length,1);assert.equal((await f.env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(x.session.session_id).first()).current_index,0);
 await f.call(x.path,{...x.body,question:'What should I focus on?'},x.token,'question-two');const followup=JSON.parse(p.seen[2].input[1].content[0].text);assert.equal(followup.previous_questions[0].question,x.body.question);assert.equal(followup.previous_questions[0].answer,answer.answer);
 }finally{p.restore();f.close();}
});
test('concurrent retries share one durable question claim and cannot delete a processing answer',async()=>{
 const f=fixture(),h=hold(),p=provider({gate:h.wait});try{const x=await practice(f),first=f.call(x.path,x.body,x.token,'same-request');await h.ready;const second=await f.call(x.path,x.body,x.token,'same-request');assert.equal(second.status,202);const row=(await second.json()).record;assert.equal((await f.call(x.path+'/'+row.id,undefined,x.token,null,'DELETE')).status,409);assert.equal((await f.call(x.path,{...x.body,question:'Different question'},x.token,'another-request')).status,429);h.release();assert.equal((await first).status,201);assert.equal(p.generations(),1);assert.equal((await f.env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first()).calls,1);
 }finally{h.release();p.restore();f.close();}
});
test('invalid questions, foreign steps, reused keys and cross-origin writes cannot buy an answer',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f);for(const body of [{...x.body,question:''},{...x.body,question:'x'.repeat(1501)},{...x.body,step:{instructions:'Injected'}},{...x.body,question:7}])assert.equal((await f.call(x.path,body,x.token,'invalid')).status,422);assert.equal((await f.call(x.path,{...x.body,step_id:'foreign'},x.token,'bad-step')).status,404);assert.equal((await f.call(x.path,x.body,x.token,null)).status,422);assert.equal((await f.call(x.path,x.body,x.token,'cross','POST',null,'https://evil.example')).status,403);assert.equal((await f.call(x.path,x.body,x.token,'missing-origin','POST',null,null)).status,403);assert.equal(p.generations(),0);
 await f.call(x.path,x.body,x.token,'used');assert.equal((await f.call(x.path,{...x.body,question:'Changed'},x.token,'used')).status,409);assert.equal(p.generations(),1);
 }finally{p.restore();f.close();}
});
test('question histories and individual answers require the owning session or account',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f,'alice'),saved=await(await f.call(x.path,x.body,x.token,'owned','POST','alice')).json();for(const actor of [null,'bob']){assert.equal((await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token,null,'GET',actor)).status,401);assert.equal((await f.call(x.path+'/'+saved.record.id,undefined,x.token,null,'DELETE',actor)).status,401);}const other=await practice(f);assert.equal((await f.call(other.path+'/'+saved.record.id,undefined,other.token)).status,404);assert.equal(p.generations(),1);
 }finally{p.restore();f.close();}
});
test('failed provider replies are redacted and the same request is never regenerated',async()=>{
 const f=fixture(),p=provider({fail:true});try{const x=await practice(f),response=await f.call(x.path,x.body,x.token,'failure');assert.equal(response.status,502);const text=await response.text();assert.ok(!text.includes('TEST_ONLY_PRIVATE')&&!text.includes('Private upstream'));const retry=await f.call(x.path,x.body,x.token,'failure');assert.equal(retry.status,200);assert.equal((await retry.json()).record.status,'failed');assert.equal(p.generations(),1);assert.ok((await f.env.DB.prepare('SELECT charged_micro FROM ai_budget WHERE id=1').first()).charged_micro>0);
 }finally{p.restore();f.close();}
});
test('an invented source quote cannot be returned as a lesson-grounded answer',async()=>{
 const f=fixture(),p=provider({value:{...answer,basis:'step_instructions',source_quote:'This passage does not exist in the selected lesson.'}});try{const x=await practice(f),response=await f.call(x.path,x.body,x.token,'invented');assert.equal(response.status,502);assert.equal((await response.json()).error.code,'ungrounded_answer');const history=await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json();assert.equal(history.questions[0].answer,null);assert.equal(history.questions[0].status,'failed');
 }finally{p.restore();f.close();}
});
test('expired processing records cannot accept late answers or silently buy replacements',async()=>{
 const f=fixture(),h=hold(),p=provider({gate:h.wait});try{const x=await practice(f),pending=f.call(x.path,x.body,x.token,'expired');await h.ready;await f.env.DB.prepare('UPDATE practice_questions SET created_at=? WHERE session_id=?').bind(Date.now()-130000,x.session.session_id).run();const history=await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json();assert.equal(history.questions[0].status,'failed');h.release();assert.equal((await pending).status,409);const replay=await(await f.call(x.path,x.body,x.token,'expired')).json();assert.equal(replay.record.status,'failed');assert.equal(replay.record.answer,null);assert.equal(p.generations(),1);
 }finally{h.release();p.restore();f.close();}
});
test('deleting a question redacts saved text while retaining a non-billable retry tombstone',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f),saved=await(await f.call(x.path,x.body,x.token,'delete-this')).json();assert.equal((await f.call(x.path+'/'+saved.record.id,undefined,x.token,null,'DELETE')).status,204);const row=await f.env.DB.prepare('SELECT question,answer_json,status FROM practice_questions WHERE id=?').bind(saved.record.id).first();assert.equal(row.question,'');assert.equal(row.answer_json,null);assert.equal(row.status,'deleted');assert.equal((await f.call(x.path,x.body,x.token,'delete-this')).status,410);assert.equal((await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json()).questions.length,0);assert.equal(p.generations(),1);
 }finally{p.restore();f.close();}
});
test('self-review lessons can ask about any actual step without advancing the practice',async()=>{
 const f=fixture(),p=provider();try{const lesson=await(await f.call('/v1/lessons',{processing_mode:'structured_text',source_text:'1. Draw a circle on paper.\n2. Shade the lower edge.'})).json();const x=await practice(f,null,lesson.id);assert.equal(lesson.steps[1].photo_assessable,false);const response=await f.call(x.path,{...x.body,step_id:lesson.steps[1].id},x.token,'self-review-question');assert.equal(response.status,201);const context=JSON.parse(p.seen[0].input[1].content[0].text);assert.equal(context.step.id,lesson.steps[1].id);assert.equal((await f.env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(x.session.session_id).first()).current_index,0);
 }finally{p.restore();f.close();}
});
test('the question migration preserves existing practices and the shared spending ledger',async()=>{
 const db=new DatabaseSync(':memory:');try{const dir=new URL('../drizzle/',import.meta.url);for(const name of (await readdir(dir)).filter(name=>name.endsWith('.sql')&&!name.startsWith('0009')).sort())db.exec(await readFile(new URL(name,dir),'utf8'));db.exec("INSERT INTO ai_budget(id,charged_micro,calls,paused) VALUES(1,141006,21,0); INSERT INTO practice_sessions(id,lesson_id,token_hash,current_index,created_at,updated_at) VALUES('existing','lesson','hash',1,1,1)");db.exec(await readFile(new URL('0009_step_questions.sql',dir),'utf8'));assert.equal(db.prepare('SELECT charged_micro FROM ai_budget WHERE id=1').get().charged_micro,141006);assert.equal(db.prepare('SELECT calls FROM ai_budget WHERE id=1').get().calls,21);assert.equal(db.prepare("SELECT current_index FROM practice_sessions WHERE id='existing'").get().current_index,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM practice_questions').get().n,0);
 }finally{db.close();}
});

test('exhausted AI budget still permits saved answers and never starts another provider request',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f);await f.call(x.path,x.body,x.token,'saved-first');await f.env.DB.prepare('UPDATE ai_budget SET charged_micro=? WHERE id=1').bind(AI_BUDGET_MICRO).run();const before=p.seen.length;const response=await f.call(x.path,{...x.body,question:'Can you explain another detail?'},x.token,'out-of-budget');assert.equal(response.status,402);assert.equal(p.seen.length,before);const history=await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json();assert.equal(history.questions.find(item=>item.request_key==='saved-first').answer.answer,answer.answer);assert.equal((await f.env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first()).calls,1);
 }finally{p.restore();f.close();}
});
test('the bounded question history rejects a fifty-first question before contacting AI',async()=>{
 const f=fixture(),p=provider();try{const x=await practice(f);for(let i=0;i<50;i++)await f.env.DB.prepare("INSERT INTO practice_questions(id,session_id,step_id,idem_key,request_hash,question,status,created_at) VALUES(?,?,?,?,?,?,'failed',?)").bind('question_'+i,x.session.session_id,x.body.step_id,'old_'+i,'hash_'+i,'Question '+i,i).run();assert.equal((await f.call(x.path,x.body,x.token,'over-limit')).status,429);assert.equal(p.seen.length,0);assert.equal((await(await f.call(x.path+'?step_id='+x.body.step_id,undefined,x.token)).json()).questions.length,50);
 }finally{p.restore();f.close();}
});
