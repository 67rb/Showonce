/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveTutorial} from '../src/sources.mjs';
import {sourceURL} from '../src/core.mjs';
import {localDB,localBucket} from './d1-local.mjs';
import {readFile} from 'node:fs/promises';
const speech='Draw a circle with a pencil on paper. Shade the lower edge gradually. Leave the upper area light. Blend the shaded edge gently with a finger.';
const free={plan:'Free',maxCredits:100,usedCredits:0};
const env=()=>({DB:localDB(),SUPADATA_ENABLED:'free-only',SUPADATA_API_KEY:'test-server-secret'});
function provider(platform='youtube',extras={}){
 const calls=[];
 const fetcher=async(input,options)=>{
  const url=new URL(input);calls.push(url.pathname);
  assert.equal(url.origin,'https://api.supadata.ai');assert.equal(options.headers['x-api-key'],'test-server-secret');assert.equal(options.redirect,'manual');
  if(url.pathname==='/v1/me')return Response.json(extras.account||free);
  if(url.pathname==='/v1/metadata')return Response.json({platform,type:extras.type||'video',description:extras.description??'A drawing practice.'});
  if(url.pathname==='/v1/transcript'){
   assert.equal(url.searchParams.get('mode'),'auto');assert.equal(url.searchParams.get('text'),'true');
   return extras.start?.(url)||Response.json({content:speech,lang:'en'});
  }
  if(url.pathname==='/v1/transcript/job_test')return extras.poll?.()||Response.json({status:'completed',content:[{text:speech,offset:0,duration:10000}]});
  throw new Error('Unexpected provider endpoint');
 };
 return {calls,fetcher};
}
test('public link matrix accepts shared/mobile and Facebook URLs',()=>{
 for(const link of ['https://m.tiktok.com/v/123456789.html','https://www.facebook.com/reel/123456/','https://fb.watch/AbCd123/','https://www.facebook.com/share/v/AbCd123/','https://facebook.com/watch/?v=123456&ref=sharing','https://m.facebook.com/maker/posts/pfbidABC123/','https://www.facebook.com/groups/123/permalink/456/','https://mobile.x.com/maker/status/123'])assert.ok(sourceURL(link));
 assert.equal(sourceURL('https://facebook.com/watch/?v=123456&ref=sharing').search,'?v=123456');
 for(const link of ['https://facebook.com/marketplace/item/123','https://facebook.com/events/123','https://fb.watch.evil.test/abc','https://facebook.com/watch/?v=bad'])assert.throws(()=>sourceURL(link));
});
test('transcribes every supported platform through the same server-only adapter',async()=>{
 for(const [link,platform] of [['https://youtu.be/aAxGTnVNJiE','youtube'],['https://instagram.com/reel/ABC/','instagram'],['https://tiktok.com/@maker/video/123','tiktok'],['https://x.com/maker/status/123','twitter'],['https://facebook.com/reel/123/','facebook']]){
  const e=env(),p=provider(platform);
  try{const source=await resolveTutorial(e,link,p.fetcher);assert.equal(source.origin,'social_transcript');assert.match(source.text,/Draw a circle/);assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);assert.ok(!JSON.stringify(source).includes('test-server-secret'));assert.match(source.limitations[0],/Silent visual/);}finally{e.DB.close();}
 }
});
test('free-only guard prevents all metadata/transcript calls on paid, unknown or exhausted accounts',async()=>{
 for(const account of [{...free,plan:'Pro'},{...free,plan:'Trial'},{...free,maxCredits:1000},{...free,usedCredits:100},{...free,usedCredits:-1}]){
  const e=env(),p=provider('youtube',{account});
  try{await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher),error=>['source_paid_usage_disabled','source_free_quota_exhausted'].includes(error.code));assert.deepEqual(p.calls.filter(path=>path.startsWith('/v1/')),['/v1/me']);}finally{e.DB.close();}
 }
});
test('exhausted Supadata falls back to public YouTube captions with no provider spend',async()=>{
 const e=env();const calls=[];
 const fetcher=async(input)=>{
  const url=new URL(input);calls.push(url.origin+url.pathname);
  if(url.origin==='https://api.supadata.ai'){assert.equal(url.pathname,'/v1/me');return Response.json({plan:'Free',maxCredits:100,usedCredits:100});}
  if(url.href.startsWith('https://www.youtube.com/watch'))return new Response('<html><script>{"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=aAxGTnVNJiE&lang=en","languageCode":"en","kind":"asr"}]}</script></html>',{headers:{'content-type':'text/html'}});
  if(url.href.startsWith('https://www.youtube.com/api/timedtext'))return Response.json({events:[{segs:[{utf8:'Draw a circle with a pencil on paper. '}]},{segs:[{utf8:'Shade the lower edge gradually and blend it gently with a finger.'}]}]});
  throw new Error('Unexpected fetch '+url.href);
 };
 try{
  const source=await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',fetcher);
  assert.equal(source.origin,'social_transcript');assert.match(source.text,/Draw a circle/);assert.match(source.limitations.at(-1),/free source-processing allowance is unavailable/);
  assert.deepEqual(calls.filter(path=>path.includes('api.supadata.ai')),['https://api.supadata.ai/v1/me']);
  const cached=await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',fetcher);assert.equal(cached.origin,'social_transcript');
 }finally{e.DB.close();}
});
test('exhausted Supadata without public captions keeps the quota error',async()=>{
 const e=env();
 const fetcher=async(input)=>{
  const url=new URL(input);
  if(url.origin==='https://api.supadata.ai')return Response.json({plan:'Free',maxCredits:100,usedCredits:100});
  return new Response('<html><body>No captions here.</body></html>',{headers:{'content-type':'text/html'}});
 };
 try{await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',fetcher),error=>error.code==='source_free_quota_exhausted');}finally{e.DB.close();}
});
test('simultaneous duplicate links create one extraction and use the cached result',async()=>{
 const e=env(),p=provider();try{
  let release,started;const gate=new Promise(resolve=>release=resolve),entered=new Promise(resolve=>started=resolve);
  const blocked=async(input,options)=>{if(new URL(input).pathname==='/v1/metadata'){started();await gate;}return p.fetcher(input,options);};
  const first=resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE?si=tracking',blocked);await entered;
  const others=await Promise.all(Array.from({length:7},()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE?si=tracking',blocked)));
  assert.ok(others.every(x=>x.status==='source_processing'));release();assert.equal((await first).origin,'social_transcript');
  assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);
  const calls=p.calls.length;const cached=await resolveTutorial(e,'https://youtube.com/shorts/aAxGTnVNJiE',p.fetcher);
  assert.equal(cached.origin,'social_transcript');assert.equal(p.calls.length,calls);
 }finally{e.DB.close();}
});
test('async jobs survive retry and resume without creating another transcription',async()=>{
 const e=env(),p=provider('youtube',{start:()=>Response.json({jobId:'job_test'},{status:202})});try{
  const pending=await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher);assert.equal(pending.status,'source_processing');assert.equal(pending.jobId,undefined);
  await e.DB.prepare('UPDATE source_extractions SET updated_at=?').bind(Date.now()-5000).run();
  const ready=await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher);assert.match(ready.text,/Draw a circle/);
  assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);assert.equal(p.calls.filter(x=>x==='/v1/transcript/job_test').length,1);
 }finally{e.DB.close();}
});
test('transient polling failures retain the job for safe resume',async()=>{
 let broken=true;const e=env(),p=provider('youtube',{start:()=>Response.json({jobId:'job_test'},{status:202}),poll:()=>broken?new Response('private provider error',{status:503}):Response.json({status:'completed',content:speech})});try{
  await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher);
  await e.DB.prepare('UPDATE source_extractions SET updated_at=?').bind(Date.now()-5000).run();
  await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher),error=>error.code==='source_provider_unavailable'&&!error.message.includes('private provider error'));
  assert.equal((await e.DB.prepare('SELECT status FROM source_extractions').first()).status,'processing');
  broken=false;await e.DB.prepare('UPDATE source_extractions SET updated_at=?').bind(Date.now()-5000).run();
  assert.equal((await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher)).origin,'social_transcript');
  assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);
 }finally{e.DB.close();}
});
test('public image/post captions work without sending them to a transcription endpoint',async()=>{
 for(const type of ['image','carousel','post']){const e=env(),p=provider('instagram',{type,description:speech});try{const source=await resolveTutorial(e,'https://instagram.com/p/ABC/',p.fetcher);assert.equal(source.origin,'social_post_text');assert.ok(!p.calls.includes('/v1/transcript'));}finally{e.DB.close();}}
});
test('silent video and image-only posts do not manufacture a lesson source',async()=>{
 for(const extras of [{type:'image',description:'Just a picture'},{description:'',start:()=>Response.json({content:[]})}]){const e=env(),p=provider('instagram',extras);try{await assert.rejects(()=>resolveTutorial(e,'https://instagram.com/p/ABC/',p.fetcher),error=>error.code==='source_insufficient_content');}finally{e.DB.close();}}
});
test('uncertain starts are not automatically repeated and keys never leave the fixed provider origin',async()=>{
 const e=env(),p=provider('youtube',{start:()=>new Response(null,{status:302,headers:{location:'https://evil.test/token'}})});try{
  for(let i=0;i<2;i++)await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher),error=>error.code==='source_provider_unavailable');
  assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);
 }finally{e.DB.close();}
});
test('disabled integration never sends a Supadata key anywhere',async()=>{
 const e=env();delete e.SUPADATA_ENABLED;let calls=0;try{const result=await resolveTutorial(e,'https://instagram.com/p/ABC/',async(url,options)=>{calls++;assert.ok(url.startsWith('https://instagram.com/'));assert.ok(!Object.values(options.headers).includes(e.SUPADATA_API_KEY));return new Response('<meta name="description" content="'+speech+'">',{headers:{'content-type':'text/html'}});});assert.equal(result.origin,'social_post_text');assert.equal(calls,1);}finally{e.DB.close();}
});
test('paid plan appearing after metadata still cannot start transcription',async()=>{
 const e=env(),p=provider();let accountCalls=0;
 const fetcher=async(input,options)=>new URL(input).pathname==='/v1/me'?Response.json(++accountCalls===1?free:{...free,plan:'Pro'}):p.fetcher(input,options);
 try{await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',fetcher),error=>error.code==='source_paid_usage_disabled');assert.equal(accountCalls,2);assert.ok(!p.calls.includes('/v1/transcript'));}finally{e.DB.close();}
});
test('mismatched metadata and hostile job IDs are rejected before any follow-up request',async()=>{
 for(const p of [provider('instagram'),provider('youtube',{start:()=>Response.json({jobId:'../../evil'},{status:202})})]){const e=env();try{await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher),error=>error.code==='source_provider_invalid');assert.ok(!p.calls.some(x=>x.includes('evil')));}finally{e.DB.close();}}
});
test('Meta credentials are rejected locally rather than sent to another service',async()=>{
 const e=env();e.SUPADATA_API_KEY='LLM_test_placeholder';let calls=0;
 try{await assert.rejects(()=>resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',async()=>{calls++;throw new Error('No network expected');}),error=>error.code==='source_provider_setup');assert.equal(calls,0);}finally{e.DB.close();}
});
test('both lesson endpoints expose pending extraction as HTTP 202 without calling Meta',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env(),p=provider('youtube',{start:()=>Response.json({jobId:'job_test'},{status:202})}),previous=globalThis.fetch;
 globalThis.fetch=p.fetcher;
 try{
  for(const path of ['/v1/lessons','/api/ingest']){
   const response=await worker.fetch(new Request('https://showonce.test'+path,{method:'POST',headers:{'content-type':'application/json',origin:'https://showonce.test'},body:JSON.stringify({source_url:'https://youtu.be/aAxGTnVNJiE'})}),e);
   assert.equal(response.status,202);assert.deepEqual(await response.json(),{status:'source_processing',retry_after_ms:5000});
  }
  assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);
  const config=await (await worker.fetch(new Request('https://showonce.test/api/config'),e)).json();
  assert.equal(config.source_processing.enabled,true);assert.equal(config.source_processing.free_only,true);assert.ok(!JSON.stringify(config).includes('test-server-secret'));
 }finally{globalThis.fetch=previous;e.DB.close();}
});
test('readiness requires the source migration when extraction is enabled',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env();e.BUCKET=localBucket();
 try{
  assert.equal((await worker.fetch(new Request('https://showonce.test/health'),e)).status,200);
  await e.DB.prepare('DROP TABLE source_extractions').run();
  assert.equal((await worker.fetch(new Request('https://showonce.test/health'),e)).status,503);
  delete e.SUPADATA_ENABLED;
  assert.equal((await worker.fetch(new Request('https://showonce.test/health'),e)).status,200);
 }finally{e.DB.close();}
});
test('accepts the actual Free (100/mo) plan label with bounded included credits',async()=>{
 const e=env(),p=provider('youtube',{account:{plan:'Free (100/mo)',maxCredits:100,usedCredits:0}});
 try{assert.equal((await resolveTutorial(e,'https://youtu.be/aAxGTnVNJiE',p.fetcher)).origin,'social_transcript');assert.equal(p.calls.filter(x=>x==='/v1/transcript').length,1);}finally{e.DB.close();}
});
