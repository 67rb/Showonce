/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolveTutorial,resolveVideoDemonstration,observedVideoSource,videoObservationSchema} from '../src/sources.mjs';
import {groundedLesson,makeLesson} from '../src/core.mjs';
import {localDB} from './d1-local.mjs';
const url='https://www.youtube.com/watch?v=nQ7Nz81TgGQ';
const data={skill:'Bugle playing',domain:'music',content_type:'demonstration',observations:[{timestamp_seconds:3,description:'The performer holds a bugle steadily with an upright posture.',evidence_type:'visual'},{timestamp_seconds:30,description:'The musician plays a sustained phrase followed by a short pause.',evidence_type:'audiovisual'},{timestamp_seconds:65,description:'A long final tone settles into silence before the instrument is lowered.',evidence_type:'audiovisual'}],limitations:['No spoken lesson or exact score is available.']};
const env=()=>({DB:localDB(),SUPADATA_ENABLED:'free-only',SUPADATA_API_KEY:'test-server-secret'});
function provider({usedCredits=0,analysis=data,platform='youtube',sourceUrl=url}={}){
 const calls=[];return {calls,fetcher:async(input,options)=>{
  const u=new URL(input);calls.push(u.pathname);assert.equal(u.origin,'https://api.supadata.ai');assert.equal(options.redirect,'manual');
  if(u.pathname==='/v1/me')return Response.json({plan:'Free (100/mo)',maxCredits:100,usedCredits});
  if(u.pathname==='/v1/metadata')return Response.json({platform,type:'video',title:'Visible demonstration',description:null,media:{duration:89}});
  if(u.pathname==='/v1/transcript')return Response.json({content:[]});
  if(u.pathname==='/v1/extract'){assert.equal(options.method,'POST');const body=JSON.parse(options.body);assert.equal(body.url,sourceUrl);assert.equal(body.schema.properties.observations.items.properties.timestamp_seconds.maximum,89);assert.match(body.prompt,/exactly 89 seconds/);assert.ok(!options.body.includes('test-server-secret'));return Response.json({jobId:'visual_test'},{status:202});}
  if(u.pathname==='/v1/extract/visual_test')return Response.json({status:'completed',data:analysis});
  throw new Error('Unexpected endpoint '+u.pathname);
 }};
}
async function emptyTranscript(e,p){await assert.rejects(()=>resolveTutorial(e,url,p.fetcher),error=>error.code==='source_insufficient_content');}
async function unlock(e){await e.DB.prepare('UPDATE source_extractions SET updated_at=?').bind(Date.now()-5000).run();}
function generated(){return {supported:true,reason:'',title:'Suggested beginner bugle practice',category:'music',difficulty:null,materials:['Bugle'],limitations:['Suggested exercises are added coaching.'],steps:data.observations.slice(0,2).map((o,i)=>({title:i?'Sustain a comfortable tone':'Prepare a relaxed playing posture',instructions:i?'Suggested practice: play one comfortable tone and listen for a steady sound.':'Suggested practice: hold the instrument comfortably, with relaxed shoulders.',expected_visual_result:i?'A sustained tone to review by listening.':'A comfortable supported playing posture.',assessment_criteria:['A bugle is visible'],photo_assessable:true,visual_limits:['A still photo cannot establish musical quality.'],source_quote:o.description}))};}
test('observations are labelled machine-generated evidence and remain separate from added coaching',()=>{
 const source=observedVideoSource(data,url,89);assert.equal(source.origin,'video_observations');assert.equal(source.domain,'music');assert.equal(source.observations.length,3);assert.match(source.limitations.at(-1),/not a verbatim transcript/);
});
test('rejects timestamps beyond the actual clip and negative timestamps',()=>{
 for(const mutate of [v=>v.observations[2].timestamp_seconds=120,v=>v.observations[0].timestamp_seconds=-1]){const v=structuredClone(data);mutate(v);assert.throws(()=>observedVideoSource(v,url,89),error=>error.code==='source_observations_invalid');}
 assert.equal(videoObservationSchema(89).properties.observations.items.properties.timestamp_seconds.maximum,89);
});
test('a music performance becomes labelled suggested practice with listening/self-review checkpoints',async()=>{
 const source=observedVideoSource(data,url,89),lesson=await groundedLesson(generated(),source);
 assert.equal(lesson.lesson_type,'demonstration_practice');assert.match(lesson.coaching_notice,/not a verbatim transcript/);
 for(const step of lesson.steps){assert.equal(step.photo_assessable,false);assert.deepEqual(step.assessment_criteria,[]);assert.equal(step.source_reference.kind,'ai_video_observation');assert.ok(step.source_reference.timestamp_seconds<=89);assert.match(step.visual_limits.at(-1),/listening and self-review/);}
 const bad=generated();bad.steps[0].source_quote='Observed skill: Bugle playing.';await assert.rejects(()=>groundedLesson(bad,source),error=>error.code==='ungrounded_lesson');
});
test('no-speech source upgrades once to a resumable visual job and cached observations',async()=>{
 const e=env(),p=provider();try{
  await emptyTranscript(e,p);
  const pending=await Promise.all(Array.from({length:5},()=>resolveVideoDemonstration(e,url,p.fetcher)));assert.ok(pending.every(x=>x.status==='source_processing'));assert.equal(p.calls.filter(x=>x==='/v1/extract').length,1);
  await unlock(e);const source=await resolveTutorial(e,url,p.fetcher);assert.equal(source.origin,'video_observations');
  const count=p.calls.length;assert.equal((await resolveVideoDemonstration(e,url,p.fetcher)).origin,'video_observations');assert.equal(p.calls.length,count);
 }finally{e.DB.close();}
});
test('insufficient free visual credits never start extraction and never use a paid fallback',async()=>{
 const e=env(),p=provider({usedCredits:95});try{await emptyTranscript(e,p);await assert.rejects(()=>resolveVideoDemonstration(e,url,p.fetcher),error=>error.code==='source_visual_quota');assert.ok(!p.calls.includes('/v1/extract'));}finally{e.DB.close();}
});
test('invalid completed observations are retained as a failure without repeated analysis or model calls',async()=>{
 const bad=structuredClone(data);bad.observations[2].timestamp_seconds=120;const e=env(),p=provider({analysis:bad});try{
  await emptyTranscript(e,p);await resolveVideoDemonstration(e,url,p.fetcher);await unlock(e);
  await assert.rejects(()=>resolveTutorial(e,url,p.fetcher),error=>error.code==='source_observations_invalid');
  assert.equal((await e.DB.prepare('SELECT status FROM source_extractions').first()).status,'failed');
  const count=p.calls.length;await assert.rejects(()=>resolveVideoDemonstration(e,url,p.fetcher));assert.equal(p.calls.length,count);
 }finally{e.DB.close();}
});
test('coaching generation uses video-observation instructions, honours the learner goal and retains evidence',async()=>{
 const e=env(),before=globalThis.fetch;const requests=[];e.MODEL_API_KEY='meta-test-secret';
 globalThis.fetch=async(path,options)=>{const body=JSON.parse(options.body);requests.push(body);if(path.endsWith('/input_tokens'))return Response.json({input_tokens:500});return Response.json({status:'completed',usage:{input_tokens:500,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(generated())}]}]});};
 try{const lesson=await makeLesson(e,{...observedVideoSource(data,url,89),learning_goal:'Play the music'});assert.equal(lesson.learning_goal,'Play the music');assert.match(requests[0].input[0].content,/MAY add ordinary beginner coaching/);assert.match(JSON.stringify(requests[0].input[1].content),/Play the music/);assert.equal(lesson.lesson_type,'demonstration_practice');assert.ok(!JSON.stringify(requests).includes('meta-test-secret'));}finally{globalThis.fetch=before;e.DB.close();}
});

test('unreliable timelines and invisible physical claims are omitted instead of invented',()=>{
 const v=structuredClone(data);v.observations[2].timestamp_seconds=2;v.observations.push({timestamp_seconds:80,description:'The musician increases air pressure and internal abdominal support.',evidence_type:'audiovisual'});
 const source=observedVideoSource(v,url,89);assert.ok(source.observations.every(o=>o.timestamp_seconds===null));assert.ok(source.observations.every(o=>!o.description.includes('air pressure')));assert.match(source.limitations.join(' '),/Timestamp links were omitted/);
 const unknown=structuredClone(data);unknown.observations.forEach(o=>o.timestamp_seconds=null);assert.ok(observedVideoSource(unknown,url,89).observations.every(o=>o.timestamp_seconds===null));
});
test('a silent performance becomes a demonstration lesson through the complete Worker API',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env(),p=provider(),before=globalThis.fetch;e.MODEL_API_KEY='meta-test-secret';let modelCalls=0;
 globalThis.fetch=async(input,options)=>{if(String(input).startsWith('https://api.supadata.ai/'))return p.fetcher(input,options);if(String(input).endsWith('/input_tokens'))return Response.json({input_tokens:500});if(String(input).startsWith('https://api.meta.ai/')){modelCalls++;return Response.json({status:'completed',usage:{input_tokens:500,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(generated())}]}]});}throw new Error('Unexpected external request');};
 const request=()=>new Request('https://showonce.test/v1/lessons',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source_url:url,learning_goal:'Play the music'})});
 try{
  const first=await worker.fetch(request(),e);assert.equal(first.status,202);assert.equal(modelCalls,0);await unlock(e);
  const response=await worker.fetch(request(),e),result=await response.json();assert.equal(response.status,201,JSON.stringify(result));assert.equal(result.lesson_type,'demonstration_practice');assert.equal(result.learning_goal,'Play the music');assert.equal(modelCalls,1);assert.ok(result.steps.every(s=>s.photo_assessable===false));assert.equal(p.calls.filter(x=>x==='/v1/extract').length,1);
 }finally{globalThis.fetch=before;e.DB.close();}
});
test('a non-instructional transcript is analysed once instead of repeatedly generating refusals',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env(),p=provider(),before=globalThis.fetch;e.MODEL_API_KEY='meta-test-secret';let modelCalls=0;
 globalThis.fetch=async(input,options)=>{if(new URL(input).pathname==='/v1/transcript')return Response.json({content:'This performance honours those who served. The musician stands quietly before playing a short memorial call. There are no narrated teaching instructions.'});if(String(input).startsWith('https://api.supadata.ai/'))return p.fetcher(input,options);if(String(input).endsWith('/input_tokens'))return Response.json({input_tokens:500});modelCalls++;const value=modelCalls===1?{...generated(),supported:false,reason:'No teaching instructions present.'}:generated();return Response.json({status:'completed',usage:{input_tokens:500,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});};
 const request=()=>new Request('https://showonce.test/v1/lessons',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source_url:url})});
 try{
  assert.equal((await worker.fetch(request(),e)).status,202);assert.equal(modelCalls,1);
  assert.equal((await worker.fetch(request(),e)).status,202);assert.equal(modelCalls,1);await unlock(e);
  const response=await worker.fetch(request(),e);assert.equal(response.status,201);assert.equal((await response.json()).lesson_type,'demonstration_practice');assert.equal(modelCalls,2);assert.equal(p.calls.filter(x=>x==='/v1/extract').length,1);
 }finally{globalThis.fetch=before;e.DB.close();}
});
test('visual-only processing works across all five platforms without calling any transcript endpoint',async()=>{
 for(const [sourceUrl,platform] of [[url,'youtube'],['https://instagram.com/reel/ABC/','instagram'],['https://tiktok.com/@maker/video/123','tiktok'],['https://x.com/maker/status/123','twitter'],['https://facebook.com/reel/123/','facebook']]){
  const e=env(),p=provider({sourceUrl,platform});try{
   assert.equal((await resolveTutorial(e,sourceUrl,p.fetcher,{visualOnly:true})).status,'source_processing');assert.ok(!p.calls.includes('/v1/transcript'));await unlock(e);
   const source=await resolveTutorial(e,sourceUrl,p.fetcher,{visualOnly:true});assert.equal(source.origin,'video_observations');assert.equal(p.calls.filter(x=>x==='/v1/extract').length,1);
  }finally{e.DB.close();}
 }
});
test('non-musical silent demonstrations create visual practice with appropriate photo criteria',async()=>{
 const craft={skill:'Paper folding',domain:'visual_practical',content_type:'demonstration',observations:[{timestamp_seconds:null,description:'The hands fold a square paper diagonally and press a crease.',evidence_type:'visual'},{timestamp_seconds:null,description:'The paper is opened again to reveal the diagonal crease.',evidence_type:'visual'}],limitations:['The exact dimensions of the sheet are not established.']};
 const source=observedVideoSource(craft,'https://instagram.com/reel/ABC/',89),value=generated();value.category='origami';value.materials=['Paper'];value.steps.forEach((s,i)=>{s.source_quote=craft.observations[i].description;s.assessment_criteria=['A diagonal crease is visible'];});
 const lesson=await groundedLesson(value,source);assert.equal(lesson.lesson_type,'demonstration_practice');assert.ok(lesson.steps.every(s=>s.photo_assessable===true));assert.ok(lesson.steps.every(s=>s.source_reference.timestamp_seconds===null));
});
test('the visual-mode Worker request bypasses transcripts from first request to saved lesson',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env(),p=provider(),before=globalThis.fetch;e.MODEL_API_KEY='meta-test-secret';
 globalThis.fetch=async(input,options)=>{if(String(input).startsWith('https://api.supadata.ai/'))return p.fetcher(input,options);if(String(input).endsWith('/input_tokens'))return Response.json({input_tokens:500});return Response.json({status:'completed',usage:{input_tokens:500,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(generated())}]}]});};
 const request=()=>new Request('https://showonce.test/v1/lessons',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source_url:url,learning_mode:'visual'})});
 try{assert.equal((await worker.fetch(request(),e)).status,202);await unlock(e);const r=await worker.fetch(request(),e);assert.equal(r.status,201);assert.equal((await r.json()).content_origin,'video_observations');assert.ok(!p.calls.includes('/v1/transcript'));}finally{globalThis.fetch=before;e.DB.close();}
});
