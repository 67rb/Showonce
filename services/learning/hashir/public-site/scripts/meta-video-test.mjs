/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolveDownloadedVideo,metaVideoDownloadEnabled,MAX_META_VIDEO_SECONDS} from '../src/sources.mjs';
import {budgetSummary,groundedLesson} from '../src/core.mjs';
import {localDB} from './d1-local.mjs';
const url='https://www.youtube.com/watch?v=nQ7Nz81TgGQ';
const analysis={skill:'Bugle playing',domain:'music',content_type:'demonstration',observations:[{timestamp_seconds:3,description:'The performer holds a bugle steadily with an upright posture.',evidence_type:'visual'},{timestamp_seconds:30,description:'The musician plays a sustained phrase followed by a short pause.',evidence_type:'audiovisual'}],limitations:['No spoken lesson or exact score is available.']};
const mp4=()=>{const bytes=new Uint8Array(2048);bytes.set([0,0,0,24]);bytes.set(new TextEncoder().encode('ftypisom'),4);return bytes;};
const env=()=>({DB:localDB(),MODEL_API_KEY:'meta-test-secret',VIDEO_DOWNLOADER_URL:'https://downloader.test',VIDEO_DOWNLOADER_TOKEN:'downloader-test-secret'});
function downloader({status=200,duration=89,chunks,signed=true}={}){
 const calls=[];const state={jobs:0};return {calls,state,fetcher:async(input,options={})=>{
  calls.push(input);assert.equal(options.headers?.Authorization,'Bearer downloader-test-secret');
  if(input==='https://downloader.test/v1/jobs'){
   assert.equal(options.method,'POST');assert.equal(options.redirect,'manual');assert.equal(JSON.parse(options.body).url,url);assert.ok(!options.body.includes('meta-test-secret'));
   if(status!==200)return new Response(null,{status});
   state.jobs++;
   const list=(chunks||[{index:0,start_seconds:0,duration_seconds:duration,bytes:2048}]).map(c=>signed?{...c,signed_path:'/v1/jobs/job_test/chunks/'+c.index+'?exp=9999999999&sig=test'}:c);
   return Response.json({job_id:'job_test',duration,title:'Visible demonstration',chunks:list});
  }
  if(/^https:\/\/downloader\.test\/v1\/jobs\/job_test\/chunks\/\d+$/.test(input))return new Response(mp4(),{headers:{'Content-Type':'video/mp4','Content-Length':'2048'}});
  if(input==='https://downloader.test/v1/jobs/job_test'&&options.method==='DELETE')return new Response(null,{status:204});
  throw new Error('Unexpected downloader endpoint '+input);
 }};
}
// Routes Meta calls by endpoint and JSON-schema name; counts uploads/deletes
// and tracks video-observation concurrency and per-call quality parameters.
function metaFetch({usage={input_tokens:24000,output_tokens:300},failVideoUrl=false}={}){
 const state={calls:[],uploads:0,deletes:0,active:0,maxActive:0,videoRequests:[]};
 const fetch=async(input,options)=>{
  const path=String(input);state.calls.push(path);
  if(path==='https://api.meta.ai/v1/files'){state.uploads++;assert.equal(options.method,'POST');assert.ok(options.body instanceof FormData);return Response.json({id:'file-123',object:'file',status:'uploaded'});}
  if(path==='https://api.meta.ai/v1/files/file-123'){state.deletes++;return Response.json({id:'file-123',deleted:true});}
  if(path.endsWith('/responses/input_tokens')){const b=JSON.parse(options.body);if(failVideoUrl&&JSON.stringify(b.input).includes('input_video'))return Response.json({error:{message:'could not fetch video url'}},{status:400});return Response.json({input_tokens:171});}
  if(path.endsWith('/responses')){const body=JSON.parse(options.body);const video=body.text.format.name==='video_observations';const value=video?analysis:generated();if(video){state.videoRequests.push({model:body.model,max_output_tokens:body.max_output_tokens,schema:body.text.format.name,content:body.input[1].content.map(c=>c.type)});state.active++;state.maxActive=Math.max(state.maxActive,state.active);await new Promise(r=>setTimeout(r,15));state.active--;}return Response.json({status:'completed',usage:video?usage:{input_tokens:500,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});}
  throw new Error('Unexpected Meta endpoint '+path);
 };
 return {state,fetch};
}
function generated(){return {supported:true,reason:'',title:'Suggested beginner bugle practice',category:'music',difficulty:null,materials:['Bugle'],limitations:['Suggested exercises are added coaching.'],steps:analysis.observations.map((o,i)=>({title:i?'Sustain a comfortable tone':'Prepare a relaxed playing posture',instructions:i?'Suggested practice: play one comfortable tone and listen for a steady sound.':'Suggested practice: hold the instrument comfortably, with relaxed shoulders.',expected_visual_result:i?'A sustained tone to review by listening.':'A comfortable supported playing posture.',assessment_criteria:['A bugle is visible'],photo_assessable:true,visual_limits:['A still photo cannot establish musical quality.'],source_quote:o.description}))};}
async function withMeta(state_fetch,fn){const before=globalThis.fetch;globalThis.fetch=state_fetch;try{return await fn();}finally{globalThis.fetch=before;}}
test('downloaded MP4 is watched by Meta once and cached as video observations',async()=>{
 const e=env(),d=downloader(),m=metaFetch();try{
  assert.equal(metaVideoDownloadEnabled(e),true);assert.equal(MAX_META_VIDEO_SECONDS,3300);
  const source=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(source.origin,'video_observations');assert.equal(source.duration_seconds,89);assert.equal(d.state.jobs,1);assert.equal(m.state.uploads,0);assert.equal(m.state.deletes,0);assert.deepEqual(m.state.videoRequests[0].content,['input_text','input_video']);
  const again=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));assert.equal(again.origin,'video_observations');assert.equal(d.state.jobs,1);assert.equal(m.state.videoRequests.length,1);
  const budget=await budgetSummary(e.DB);assert.equal(budget.paused,false);assert.equal(budget.unresolved_reservations_usd,0);assert.ok(budget.calls>=1);
 }finally{e.DB.close();}
});
test('simultaneous requests start one download and one paid Meta observation',async()=>{
 const e=env(),d=downloader(),m=metaFetch();try{
  const results=await withMeta(m.fetch,()=>Promise.all(Array.from({length:5},()=>resolveDownloadedVideo(e,url,d.fetcher).catch(error=>error))));
  assert.ok(results.some(x=>x.origin==='video_observations'));assert.ok(results.every(x=>x.origin==='video_observations'||x.status==='source_processing'));assert.equal(d.state.jobs,1);assert.equal(m.state.videoRequests.length,1);
 }finally{e.DB.close();}
});
test('a failed download is retained and never reaches Meta or repeats',async()=>{
 const e=env(),d=downloader({status:422}),m=metaFetch();try{
  await withMeta(m.fetch,()=>assert.rejects(()=>resolveDownloadedVideo(e,url,d.fetcher),error=>error.code==='source_inaccessible'));
  await withMeta(m.fetch,()=>assert.rejects(()=>resolveDownloadedVideo(e,url,d.fetcher),error=>error.code==='source_inaccessible'));
  assert.equal(d.calls.length,1);assert.equal(m.state.uploads,0);assert.equal((await e.DB.prepare('SELECT status FROM source_extractions').first()).status,'failed');
 }finally{e.DB.close();}
});
test('videos longer than 10 minutes are accepted within the 55-minute limit',async()=>{
 const e=env(),d=downloader({duration:1200}),m=metaFetch();try{
  const source=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(source.origin,'video_observations');assert.equal(source.duration_seconds,1200);assert.equal(m.state.videoRequests.length,1);assert.equal(m.state.uploads,0);
 }finally{e.DB.close();}
});
test('over-long videos are rejected from downloader metadata before any Meta call',async()=>{
 const e=env(),d=downloader({duration:3301}),m=metaFetch();try{
  await withMeta(m.fetch,()=>assert.rejects(()=>resolveDownloadedVideo(e,url,d.fetcher),error=>error.code==='source_video_duration'));
  assert.equal(m.state.uploads,0);
 }finally{e.DB.close();}
});
test('multiple chunks are observed in parallel and merged with offset timestamps',async()=>{
 const chunks=[{index:0,start_seconds:0,duration_seconds:300,bytes:2048},{index:1,start_seconds:300,duration_seconds:200,bytes:2048}];
 const e=env(),d=downloader({duration:500,chunks,signed:false}),m=metaFetch();try{
  const source=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(source.duration_seconds,500);assert.equal(m.state.uploads,2);assert.equal(m.state.deletes,2);
  const times=source.observations.map(o=>o.timestamp_seconds);assert.deepEqual(times,[3,30,303,330]);
 }finally{e.DB.close();}
});
test('dense chunk observations are thinned to the merged source caps',async()=>{
 const chunks=[{index:0,start_seconds:0,duration_seconds:300,bytes:2048},{index:1,start_seconds:300,duration_seconds:200,bytes:2048}];
 const dense={...analysis,observations:Array.from({length:10},(_,i)=>({timestamp_seconds:i*20,description:'Observed action number '+i+' is performed visibly on screen.',evidence_type:'visual'})),limitations:Array.from({length:8},(_,i)=>'Limitation '+i)};
 const e=env(),d=downloader({duration:500,chunks}),m=metaFetch();const before=m.fetch;
 const denseFetch=async(input,options)=>{if(String(input).endsWith('/responses')){const body=JSON.parse(options.body);if(body.text.format.name==='video_observations')return Response.json({status:'completed',usage:{input_tokens:24000,output_tokens:300},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(dense)}]}]});}return before(input,options);};
 try{
  const source=await withMeta(denseFetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(source.observations.length,18);assert.ok(source.observations.at(-1).timestamp_seconds<=500);
  const times=source.observations.map(o=>o.timestamp_seconds);assert.deepEqual(times,[...times].sort((a,b)=>a-b));
 }finally{e.DB.close();}
});
test('up to five agents run in parallel with identical per-chunk quality settings',async()=>{
 const chunks=Array.from({length:7},(_,i)=>({index:i,start_seconds:i*100,duration_seconds:100,bytes:2048}));
 const e=env(),d=downloader({duration:700,chunks}),m=metaFetch();try{
  const source=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(m.state.maxActive,5);assert.equal(m.state.videoRequests.length,7);assert.equal(m.state.uploads,0);assert.equal(m.state.deletes,0);
  assert.ok(m.state.videoRequests.every(r=>r.model==='muse-spark-1.3'&&r.max_output_tokens===4000&&r.schema==='video_observations'&&r.content.includes('input_video')));
  const times=source.observations.map(o=>o.timestamp_seconds);assert.ok(times.includes(3)&&times.includes(630));assert.deepEqual(times,[...times].sort((a,b)=>a-b));
  const lesson=await groundedLesson(generated(),source);assert.equal(lesson.steps.length,2);assert.ok(lesson.steps.every(s=>s.source_reference.kind==='ai_video_observation'));
 }finally{e.DB.close();}
});
test('a Meta rejection of the signed URL falls back to chunk download plus file upload',async()=>{
 const e=env(),d=downloader(),m=metaFetch({failVideoUrl:true});try{
  const source=await withMeta(m.fetch,()=>resolveDownloadedVideo(e,url,d.fetcher));
  assert.equal(source.origin,'video_observations');assert.equal(m.state.uploads,1);assert.equal(m.state.deletes,1);assert.ok(d.calls.some(x=>String(x).includes('/chunks/0')));
 }finally{e.DB.close();}
});
test('visual-mode Worker request uses the downloader without Supadata and returns a demonstration lesson',async()=>{
 const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8'),worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const e=env(),d=downloader(),m=metaFetch(),before=globalThis.fetch;
 globalThis.fetch=async(input,options)=>String(input).startsWith('https://downloader.test')?d.fetcher(input,options):m.fetch(input,options);
 const request=()=>new Request('https://showonce.test/api/ingest',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({source_url:url,learning_mode:'visual',learning_goal:'Play the music'})});
 try{const response=await worker.fetch(request(),e),result=await response.json();assert.equal(response.status,201,JSON.stringify(result));assert.equal(result.lesson_type,'demonstration_practice');assert.equal(result.content_origin,'video_observations');assert.equal(result.learning_goal,'Play the music');assert.equal(d.state.jobs,1);assert.equal(m.state.uploads,0);}finally{globalThis.fetch=before;e.DB.close();}
});
