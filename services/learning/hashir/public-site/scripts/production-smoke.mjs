/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// Exercises public API behavior with fresh, synthetic free-practice records.
// Never submits a valid image or an AI source, and never logs session capabilities.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2),localMode=args.includes('--local'),positional=args.filter(arg=>arg!=='--local');
const origin=new URL(positional[0]||'https://showonce-practice-studio.jberry1972.chatgpt.site').origin;
if(!origin.startsWith('https://')&&!(localMode&&new URL(origin).hostname==='127.0.0.1'))throw new Error('Use the HTTPS deployed Site origin, or --local with loopback.');
let requests=0;
async function call(path,{body,token,key,status=200,extraHeaders={},method=body===undefined?'GET':'POST'}={}){
 requests++;
 const response=await fetch(origin+path,{method,headers:{Origin:origin,...extraHeaders,...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,status,path+' HTTP status');
 return response.json();
}
async function session(lesson_id){const value=await call('/v1/sessions',{body:{lesson_id},status:201});assert.ok(typeof value.access_token==='string'&&value.access_token.length>20,'Session access was not returned');return {id:value.session_id,token:value.access_token,step:value.current_step_id};}
const before=await call('/api/budget',{body:{}});
const [health,config]=await Promise.all([call('/health'),call('/api/config')]);
assert.equal(health.storage,'ready');
assert.equal((await call('/api/account')).authenticated,false);
assert.equal((await call('/api/account',{extraHeaders:{'oai-authenticated-user-id':'spoofed-user','oai-authenticated-user-email':'spoof@example.test'}})).authenticated,false,'The hosting boundary must strip caller-supplied identity headers');
await call('/v1/library',{status:401});
await call('/v1/admin/catalogue',{status:401});
await call('/v1/admin/reports',{status:401});
assert.equal(before.paused,false);
assert.equal((await call('/api/assess',{body:{},status:401})).error.code,'invalid_session_access');
assert.equal((await call('/v1/lessons',{body:{processing_mode:'invalid'},status:422})).error.code,'invalid_processing_mode');

const lesson=await call('/v1/lessons',{body:{processing_mode:'structured_text',source_text:'System verification\n1. Draw a circle on paper.\n2. Add a shaded edge to the circle.'},status:201});
assert.equal(lesson.steps.length,2);
const own=await session(lesson.id),path='/v1/sessions/'+own.id;
await call(path,{status:401});
assert.equal((await call(path,{token:own.token})).completed_step_ids.length,0);
const key='system-smoke-'+crypto.randomUUID(),body={step_id:own.step};
const first=await call(path+'/acknowledgements',{body,token:own.token,key});
const replay=await call(path+'/acknowledgements',{body,token:own.token,key});
assert.equal(first.progress.completed_step_ids.length,1);
assert.equal(replay.progress.completed_step_ids.length,1);
assert.equal(replay.replayed,true);
assert.equal((await call(path,{token:own.token})).current_step_id,lesson.steps[1].id);

const drawing=config.examples.find(example=>example.category==='drawing');
assert.ok(drawing,'Drawing example is missing');
const visual=await session(drawing.id),frame={session_id:visual.id,lesson_id:drawing.id,step_id:visual.step,mime_type:'image/png',image_base64:'AAAA'};
await call('/api/assess',{body:frame,token:'wrong-access',status:401});
await call('/api/assess',{body:{...frame,lesson_id:'different-lesson'},token:visual.token,status:409});
assert.equal((await call('/api/assess',{body:frame,token:visual.token,status:422})).error.code,'invalid_image');
await call('/v1/sessions/'+visual.id+'/submissions',{body:frame,token:visual.token,key:'invalid-image-'+crypto.randomUUID(),status:422});
assert.equal((await call('/v1/sessions/'+visual.id,{token:visual.token})).completed_step_ids.length,0);

const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const local=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
const assets=['/','/styles.css','/app.js','/public-api.js','/team.html','/team.js','/team.css'];let hostingBootstrapScripts=0;
function appBytes(path,bytes){
 if(path!=='/'&&path!=='/team.html')return bytes;
 // Cloudflare appends its own JavaScript Detection bootstrap to HTML responses.
 // Remove only that identified inline bootstrap for build comparison. Any other
 // HTML change, and every CSS/JS byte, must still match the verified build.
 return Buffer.from(bytes.toString('utf8').replace(/<script>([\s\S]*?)<\/script>/g,(whole,script)=>{
  if(whole.length<3000&&script.startsWith('(function(){function c(){var b=a.contentDocument')&&script.includes('window.__CF$cv$params')&&script.includes('/cdn-cgi/challenge-platform/scripts/jsd/main.js')){hostingBootstrapScripts++;return '';}
  return whole;
 }));
}
await Promise.all(assets.map(async path=>{
 requests++;const response=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,path+' asset status');
 const expected=await local.fetch(new Request(origin+path),{});
 const hash=data=>createHash('sha256').update(data).digest('hex');
 assert.equal(hash(appBytes(path,Buffer.from(await response.arrayBuffer()))),hash(Buffer.from(await expected.arrayBuffer())),path+' deployed asset differs from the verified build');
}));
const after=await call('/api/budget',{body:{}});
assert.equal(after.calls,before.calls,'A provider call occurred during the free smoke checks');
assert.equal(after.charged_or_reserved_usd,before.charged_or_reserved_usd,'Budget changed during the free smoke checks');
assert.equal(after.paused,false);
const report={origin,checked_at:new Date().toISOString(),requests,health,budget_before:before,budget_after:after,matching_interface_assets:assets.length,hosting_bootstrap_scripts:hostingBootstrapScripts,free_progress_and_replay:true,camera_access_and_validation:true};
if(positional[1])await writeFile(positional[1],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
