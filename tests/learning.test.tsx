/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {renderToString} from 'react-dom/server';
// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import worker from '../services/learning/hashir/public-site/dist/server/index.js';
import {localDB,localBucket} from '../services/learning/hashir/public-site/scripts/d1-local.mjs';
import {IdentityProvider} from '@/components/learning/Identity';
import {MinimalChrome} from '@/components/MinimalChrome';
import {LearningWorkspace} from '@/components/learning/Workspace';
import {lessonHref,photoData,entryFrom,type Lesson,type Progress} from '@/lib/learning';
import '../public/practice-library.js';
const {push}=vi.hoisted(()=>({push:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push}),usePathname:()=>'/create/'}));
vi.mock('@/components/create/SatinBackdrop',()=>({SatinBackdrop:()=>null}));
let env:{DB:ReturnType<typeof localDB>;BUCKET:ReturnType<typeof localBucket>},actor:string|null=null;
const calls:{path:string;body?:Record<string,unknown>;headers:Record<string,string>}[]=[];
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);env={DB:localDB(path.resolve("services/learning/hashir/public-site/drizzle")),BUCKET:localBucket()};actor=null;calls.length=0;push.mockClear();window.localStorage.clear();window.history.replaceState(null,'','/create/');vi.stubGlobal('fetch',async(route:string,options:RequestInit={})=>{
 if(!route.startsWith('/'))throw new Error('External provider requests are forbidden in this test.');
 const headers={Origin:'https://test.example',...options.headers,...(actor?{'oai-authenticated-user-id':actor,'oai-authenticated-user-email':actor+'@example.test'}:{})} as Record<string,string>;
 calls.push({path:route,body:typeof options.body==='string'?JSON.parse(options.body):undefined,headers});
 return worker.fetch(new Request('https://test.example'+route,{method:options.method,headers,body:options.body}),env);
});});
afterEach(()=>{cleanup();env?.DB.close();vi.unstubAllGlobals();});
const show=(mode:'create'|'library'|'play'='create')=>render(<IdentityProvider><LearningWorkspace screen={mode}/></IdentityProvider>);
async function preparePractice(lessonID='example_draw-shading'){
 const lesson=await(await worker.fetch(new Request('https://test.example/v1/lessons/'+lessonID),env)).json() as Lesson;
 const progress=await(await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:lesson.id})}),env)).json() as Progress;
 window.ShowOnceLibrary!.remember(window.localStorage,entryFrom(lesson,progress,progress.access_token),[]);window.history.replaceState(null,'',lessonHref(lesson.id,progress.session_id,'play'));return {lesson,progress};
}
async function savedIllustration(lesson:Lesson,stepIndex=0){
 const target=lesson.steps[stepIndex],id='illustration_'+createHash('sha256').update(lesson.id+'|'+target.id+'|v2').digest('hex');
 await env.DB.prepare("INSERT INTO illustration_candidates(id,lesson_id,step_id,claim_nonce,status,image_key,mime_type,review_json,created_at) VALUES(?,?,?,'test','ready',?,'image/png',?,0)").bind(id,lesson.id,target.id,'test/'+id,JSON.stringify({usable:true,issues:[]})).run();
 await env.BUCKET.put('test/'+id,await readFile('services/learning/hashir/public-site/web/fixtures/images/cup_01_correct.png'));
}
function imageURLs(){const NativeURL=URL;const revoke=vi.fn();vi.stubGlobal('URL',class extends NativeURL {static createObjectURL=vi.fn(()=> 'blob:saved-step');static revokeObjectURL=revoke;});return revoke;}
describe('working frontend with the actual learning Worker',()=>{
 it('server-renders the public create heading before account and configuration requests finish',()=>{
  const html=renderToString(<IdentityProvider><LearningWorkspace screen="create"/></IdentityProvider>);
  expect(html).toContain('Learn something');expect(html).toContain('Bring a skill you want to practice.');expect(html).toContain('aria-label="Loading the create workspace"');expect(html).not.toContain('aria-label="Tutorial link"');expect(calls).toHaveLength(0);
 });
 it('creates a free lesson from entered instructions and saves a real resumable practice',async()=>{
  show();await screen.findByRole('button',{name:'Free numbered steps'});expect(screen.queryByRole('textbox',{name:/Paste this tutorial/})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Free numbered steps'}));fireEvent.change(screen.getByRole('textbox',{name:'2–18 numbered instructions'}),{target:{value:'1. Draw a circle on paper.\n2. Shade its lower edge.'}});fireEvent.click(screen.getByRole('button',{name:'Create free practice'}));fireEvent.click(await screen.findByRole('button',{name:'3 · Start practicing'}));await waitFor(()=>expect(push).toHaveBeenCalled());
  expect(calls.find(call=>call.path==='/v1/lessons')?.body?.processing_mode).toBe('structured_text');expect(calls.find(call=>call.path==='/v1/sessions')?.body?.save_to_account).toBe(false);expect(push.mock.calls[0][0]).toMatch(/^\/lesson\/runtime\/play\/\?lesson_id=lesson_/);const saved=JSON.parse(window.localStorage.getItem('showonce-library-v1')!);expect(saved.entries).toHaveLength(1);expect(saved.entries[0].token).toBeTruthy();expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM practice_sessions').first())?.count).toBe(1);expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('account practices never write a private capability into browser snapshots',async()=>{
  actor='alice';show();await screen.findByRole('button',{name:/Fold a paper cup/});fireEvent.click(screen.getByRole('button',{name:/Fold a paper cup/}));fireEvent.click(await screen.findByRole('button',{name:'3 · Start practicing'}));await waitFor(()=>expect(push).toHaveBeenCalled());expect(window.localStorage.getItem('showonce-library-v1')).toBeNull();const session=await env.DB.prepare('SELECT owner_id FROM practice_sessions').first();expect(session?.owner_id).toBeTruthy();expect(calls.find(call=>call.path==='/v1/sessions')?.headers['X-ShowOnce-Account']).toMatch(/^account_/);
 });
 it('uses edited review instructions when starting a practice',async()=>{
  show();fireEvent.click(await screen.findByRole('button',{name:'Free numbered steps'}));fireEvent.change(screen.getByRole('textbox',{name:'2–18 numbered instructions'}),{target:{value:'1. Draw a circle on paper.\n2. Shade its lower edge.'}});fireEvent.click(screen.getByRole('button',{name:'Create free practice'}));const first=await screen.findByRole('textbox',{name:'Step 1'});fireEvent.change(first,{target:{value:'Draw a square on paper.'}});fireEvent.click(screen.getByRole('button',{name:'3 · Start practicing'}));await waitFor(()=>expect(push).toHaveBeenCalled());const creates=calls.filter(call=>call.path==='/v1/lessons');expect(creates).toHaveLength(2);expect(creates[1].body?.source_text).toContain('1. Draw a square on paper.');expect(creates[1].body?.processing_mode).toBe('structured_text');
 });
 it('opens the public sample overview immediately from the home page',async()=>{
  const {HomePractice}=await import('@/components/learning/HomePractice');render(<IdentityProvider><HomePractice/></IdentityProvider>);const button=screen.getByRole('button',{name:'Try a sample lesson'});await waitFor(()=>expect((button as HTMLButtonElement).disabled).toBe(false));fireEvent.click(button);await waitFor(()=>expect(push).toHaveBeenCalled());expect(push.mock.calls[0][0]).toBe('/lesson/sample');expect(calls.find(call=>call.path==='/v1/sessions')).toBeUndefined();
 });
 it('shows the next checkpoint for an existing browser practice',async()=>{
  const {lesson,progress}=await preparePractice();window.ShowOnceLibrary!.remember(window.localStorage,entryFrom(lesson,progress,progress.access_token),[]);const {HomePractice}=await import('@/components/learning/HomePractice');render(<IdentityProvider><HomePractice/></IdentityProvider>);const link=await screen.findByRole('link',{name:/Continue practice:/});expect(link.getAttribute('href')).toContain('session_id='+progress.session_id);expect(link.textContent).toContain('Next:');
 });
 it('the account library renders server records rather than design fixtures',async()=>{
  actor='alice';let response=await worker.fetch(new Request('https://test.example/api/account',{headers:{'oai-authenticated-user-id':actor,'oai-authenticated-user-email':'alice@example.test'}}),env);expect(response.status).toBe(200);response=await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':actor,'oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);expect(response.status).toBe(201);show('library');await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});expect(screen.queryByText('The stepped tower')).toBeNull();expect(screen.getByRole('link',{name:'Continue practice'}).getAttribute('href')).toContain('session_id=');
 });
 it('a different signed-in account sees none of the previous account practices',async()=>{
  await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);actor='bob';show('library');await screen.findByRole('heading',{name:'Your next practice starts here.'});expect(screen.queryByRole('heading',{name:'Practice a steady guitar rhythm'})).toBeNull();
 });
 it('keeps accessible browser practices visible when one saved session cannot refresh',async()=>{
  const unavailable=await preparePractice('example_draw-shading');await preparePractice('example_guitar-rhythm');
  const original=globalThis.fetch;
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>String(args[0])==='/v1/sessions/'+unavailable.progress.session_id?Response.json({error:{code:'temporary_failure',message:'Temporary failure'}},{status:503}):original(...args));
  show('library');
  await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});
  expect(screen.getByRole('alert').textContent).toMatch(/1 saved practice could not be refreshed/);
  expect(JSON.parse(window.localStorage.getItem('showonce-library-v1')!).entries).toHaveLength(2);
 });
 it('offers clear filters when the account has no completed practices',async()=>{
  actor='alice';await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':actor,'oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);
  show('library');await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});
  fireEvent.change(screen.getByRole('combobox',{name:'Status'}),{target:{value:'completed'}});
  await screen.findByRole('heading',{name:'No matching practices.'});
  fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));
  await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});
 });
 it('does not mistake a failed account library request for an empty library',async()=>{
  actor='alice';const original=globalThis.fetch;
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>String(args[0]).startsWith('/v1/library?')?Response.json({error:{code:'temporary_failure',message:'Saved practices could not be loaded.'}},{status:503}):original(...args));
  show('library');await screen.findByRole('alert');
  expect(screen.queryByRole('heading',{name:'Your next practice starts here.'})).toBeNull();
  expect((screen.getByRole('button',{name:'Refresh library'}) as HTMLButtonElement).disabled).toBe(false);
 });
 it('rechecks a changed account without sending the previous identity to public configuration',async()=>{
  await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);
  actor='alice';show('library');await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});
  actor='bob';fireEvent(window,new Event('showonce-account-changed'));
  await screen.findByRole('heading',{name:'Your next practice starts here.'});
  expect(screen.queryByRole('heading',{name:'Practice a steady guitar rhythm'})).toBeNull();
  expect(calls.filter(call=>call.path==='/api/config').every(call=>!call.headers['X-ShowOnce-Account'])).toBe(true);
  expect(calls.filter(call=>call.path==='/api/account')).toHaveLength(2);
 });
 it('a denied server practice cannot display fixture progress or offer a false completion',async()=>{
  window.history.replaceState(null,'','/lesson/runtime/play/?lesson_id=example_draw-shading&session_id=session_missing');show('play');await screen.findByRole('alert');expect(screen.queryByText('A step further along.')).toBeNull();expect(screen.queryByRole('button',{name:/self-review/})).toBeNull();
 });
 it('lesson URLs contain identifiers and never a private access token',()=>{const url=lessonHref('lesson_a','session_b','play');expect(url).toBe('/lesson/runtime/play/?lesson_id=lesson_a&session_id=session_b');expect(url).not.toContain('token');});
 it('unsupported and oversized photos fail locally before any network check',async()=>{await expect(photoData(new File(['text'],'work.txt',{type:'text/plain'}))).rejects.toThrow(/PNG/);await expect(photoData(new File([new Uint8Array(5242881)],'work.png',{type:'image/png'}))).rejects.toThrow(/5 MiB/);expect(calls).toHaveLength(0);});
 it('a lost acknowledgement reply retries the same key and advances only once',async()=>{
  const {lesson,progress}=await preparePractice();const original=globalThis.fetch;let lose=true;vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{const response=await original(...args);if(String(args[0]).endsWith('/acknowledgements')&&lose){lose=false;throw new Error('Reply lost after commit.');}return response;});show('play');const button=await screen.findByRole('button',{name:'I’ve practiced this step · self-review'});fireEvent.click(button);await screen.findByRole('alert');expect((await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(progress.session_id).first())?.current_index).toBe(1);fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);await screen.findByRole('heading',{name:lesson.steps[1].title||'Try this step'});const retries=calls.filter(call=>call.path.endsWith('/acknowledgements'));expect(retries).toHaveLength(2);expect(retries[0].headers['Idempotency-Key']).toBe(retries[1].headers['Idempotency-Key']);expect((await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(progress.session_id).first())?.current_index).toBe(1);
 });
 it('automatically reloads a saved step image without generation and clears it when the checkpoint changes',async()=>{
  const {lesson}=await preparePractice();await savedIllustration(lesson);const revoke=imageURLs();show('play');
  expect((await screen.findByRole('img',{name:'AI illustration: '+lesson.steps[0].expected_visual_result})).getAttribute('src')).toBe('blob:saved-step');
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);await screen.findByRole('heading',{name:lesson.steps[1].title!});
  await waitFor(()=>expect(screen.queryByRole('img')).toBeNull());await waitFor(()=>expect(revoke).toHaveBeenCalledWith('blob:saved-step'));
  fireEvent.change(screen.getByRole('combobox',{name:'Checkpoint'}),{target:{value:'0'}});
  await screen.findByRole('img',{name:'AI illustration: '+lesson.steps[0].expected_visual_result});
  expect(calls.filter(call=>call.path.endsWith('/illustration'))).toHaveLength(0);
  expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('a late image response cannot show the previous checkpoint picture on the next step',async()=>{
  const {lesson}=await preparePractice();await savedIllustration(lesson);imageURLs();const original=globalThis.fetch;
  let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{const response=await original(...args);if(String(args[0]).endsWith('/'+lesson.steps[0].id+'/illustration/image'))await held;return response;});
  show('play');fireEvent.click(await screen.findByRole('button',{name:'I’ve practiced this step · self-review'}));
  await screen.findByRole('heading',{name:lesson.steps[1].title!});release();
  await screen.findByRole('button',{name:'Generate step image · uses AI allowance'});expect(screen.queryByRole('img')).toBeNull();
 });
 it('library thumbnails load only approved saved artwork without starting generation',async()=>{
  const {lesson}=await preparePractice();await savedIllustration(lesson);imageURLs();show('library');
  await screen.findByRole('img',{name:'AI illustration preview: '+lesson.steps[0].expected_visual_result});
  expect(calls.filter(call=>call.path.endsWith('/illustration'))).toHaveLength(0);
 });
 it('the original segmented header follows actual saved checkpoint progress',async()=>{
  const {lesson}=await preparePractice();render(<IdentityProvider><MinimalChrome/><LearningWorkspace screen="play"/></IdentityProvider>);
  await screen.findByRole('heading',{name:lesson.steps[0].title!});
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);await screen.findByRole('heading',{name:lesson.steps[1].title!});
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('4');
 });
 it('free numbered practices expose local camera tools and still save progress without AI',async()=>{
  const lesson=await(await worker.fetch(new Request('https://test.example/v1/lessons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_type:'text',source_text:'1. Draw a circle on paper.\n2. Shade its lower edge.',processing_mode:'structured_text'})}),env)).json() as Lesson;
  await preparePractice(lesson.id);show('play');fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  expect(screen.getByRole('button',{name:'Open camera'})).toBeTruthy();expect(screen.queryByText('Optional AI check · uses existing allowance')).toBeNull();
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);await screen.findByRole('heading',{name:lesson.steps[1].title||'Try this step'});
  expect(screen.queryByRole('button',{name:'Open camera'})).toBeNull();expect(calls.filter(call=>call.path==='/api/assess')).toHaveLength(0);expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('typing what you want to learn sends your own words to AI lesson creation',async()=>{
  const typed='I want to learn how to draw a simple circle and shade its lower edge. I can hold the pencil lightly, but my circles come out uneven and I do not know how to shade smoothly yet.';
  const original=globalThis.fetch;let sentBody:any=null;
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{
   const body=typeof args[1]?.body==='string'?JSON.parse(args[1].body):null;
   if(String(args[0])==='/v1/lessons'&&body?.processing_mode==='ai'){sentBody=body;return Response.json({id:'lesson_topic',title:'Draw and shade a circle',category:'Drawing',difficulty:null,materials:['Paper','Pencil'],source_url:null,source_attribution:null,safety_notice:'',steps:[{id:'s1',position:1,title:'Draw a light circle',instructions:'Lightly sketch one circle on the paper.',expected_visual_result:'One light circular outline is visible.',assessment_criteria:['A circular outline is visible'],photo_assessable:true,visual_limits:[]}]});}
   if(String(args[0])==='/v1/sessions'&&body)return Response.json({session_id:'session_topic',lesson_id:'lesson_topic',account_owned:false,status:'active',current_step_id:'s1',completed_step_ids:[],completed_checkpoints:[],total_steps:1,updated_at:new Date().toISOString(),access_token:'topic-token'});
   if(String(args[0])==='/api/config'){const response=await original(...args);const value=await response.json();return Response.json({...value,ai_available:true,budget:{...(value.budget||{}),remaining_usd:4,paused:false}});}
   return original(...args);
  });
  show();await screen.findByRole('button',{name:'Type what you want to learn'});
  fireEvent.click(screen.getByRole('button',{name:'Type what you want to learn'}));
  const box=screen.getByRole('textbox',{name:/What do you want to learn/});
  fireEvent.change(box,{target:{value:'Too short.'}});
  fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
  expect(screen.getByRole('alert').textContent).toContain('Add a little more detail');
  expect(calls.find(call=>call.path==='/v1/lessons')).toBeUndefined();
  fireEvent.change(box,{target:{value:typed}});
  fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
  fireEvent.click(await screen.findByRole('button',{name:'3 · Start practicing'}));
  await waitFor(()=>expect(push).toHaveBeenCalled());
  expect(sentBody?.processing_mode).toBe('ai');
  expect(sentBody?.source_text).toBe(typed);
  expect(sentBody?.learning_goal).toBe(typed.slice(0,300));
  expect(push.mock.calls[0][0]).toContain('lesson_id=lesson_topic');
  expect(screen.queryByRole('alert')).toBeNull();
 });

 it('an exhausted allowance explains the blocked action and still creates free practice',async()=>{
  const original=globalThis.fetch;vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{const response=await original(...args);if(String(args[0])==='/api/config'){const value=await response.json();return Response.json({...value,ai_available:true,budget:{remaining_usd:0,paused:false}});}return response;});
  show();await screen.findByText('Free practice is ready.');expect((screen.getByRole('button',{name:'Get the steps'}) as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('button',{name:'Start free'}));fireEvent.change(screen.getByRole('textbox',{name:'2–18 numbered instructions'}),{target:{value:'1. Draw a circle on paper.\n2. Shade its lower edge.'}});fireEvent.click(screen.getByRole('button',{name:'Create free practice'}));fireEvent.click(await screen.findByRole('button',{name:'3 · Start practicing'}));await waitFor(()=>expect(push).toHaveBeenCalled());expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('a source quota failure offers free steps and keeps the original reference',async()=>{
  const original=globalThis.fetch;vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{if(String(args[0])==='/v1/lessons'&&JSON.parse(String(args[1]?.body)).processing_mode==='ai')return Response.json({error:{code:'source_free_quota_exhausted',message:'Free source credits are used up.'}},{status:429});const response=await original(...args);if(String(args[0])==='/api/config'){const value=await response.json();return Response.json({...value,ai_available:true});}return response;});
  const url='https://www.youtube.com/watch?v=abcdefghijk';
  show();await screen.findByRole('button',{name:'Start free'});
  fireEvent.change(screen.getByRole('textbox',{name:'Tutorial link'}),{target:{value:url}});
  fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
  expect(await screen.findByRole('button',{name:'Paste instructions or a transcript · uses AI allowance'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Use numbered steps · free'}));
  expect((screen.getByRole('textbox',{name:'Source reference (optional)'}) as HTMLInputElement).value).toBe(url);
  fireEvent.change(screen.getByRole('textbox',{name:'2–18 numbered instructions'}),{target:{value:'1. Draw a circle on paper.\n2. Shade its lower edge.'}});
  fireEvent.click(screen.getByRole('button',{name:'Create free practice'}));
  await screen.findByRole('button',{name:'3 · Start practicing'});
  expect(calls.find(call=>call.path==='/v1/lessons')?.body).toMatchObject({processing_mode:'structured_text',source_url:url});
  expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('offers paste recovery without a link attempt when source processing is disabled',async()=>{
  const original=globalThis.fetch,sent:Record<string,unknown>[]=[];
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{
   const body=typeof args[1]?.body==='string'?JSON.parse(args[1].body):null;
   if(String(args[0])==='/api/config'){const response=await original(...args);const value=await response.json();return Response.json({...value,ai_available:true,source_processing:{enabled:false},budget:{...(value.budget||{}),remaining_usd:4,paused:false}});}
   if(String(args[0])==='/v1/lessons'&&body?.processing_mode==='ai'){sent.push(body);return Response.json({id:'lesson_pasted',title:'Pasted tutorial lesson',category:'Test',materials:['Paper'],steps:[{id:'s1',position:1,title:'Step one',instructions:'Fold the paper carefully.',expected_visual_result:'A folded sheet.',assessment_criteria:[],visual_limits:['Self-review only.'],photo_assessable:false}]});}
   return original(...args);
  });
  show();
  const url='https://www.youtube.com/watch?v=abcdefghijk';
  fireEvent.change(await screen.findByRole('textbox',{name:'Tutorial link'}),{target:{value:url}});
  // The same notice also offers the explicitly free recovery: switching to
  // numbered steps makes no lesson call and keeps the link as reference.
  fireEvent.click(screen.getByRole('button',{name:'Use numbered steps · free'}));
  expect(sent).toHaveLength(0);
  expect(screen.getByRole('button',{name:'Create free practice'})).toBeTruthy();
  expect((screen.getByRole('textbox',{name:'Source reference (optional)'}) as HTMLInputElement).value).toBe(url);
  fireEvent.click(screen.getByRole('button',{name:'Tutorial link'}));
  fireEvent.click(screen.getByRole('button',{name:'Paste instructions instead'}));
  expect(sent).toHaveLength(0);
  expect((screen.getByRole('textbox',{name:'Source reference (optional)'}) as HTMLInputElement).value).toBe(url);
  const instructions='Fold the paper in half carefully, then open it again and fold each corner into the centre line slowly and neatly today.';
  fireEvent.change(screen.getByRole('textbox',{name:'Instructions or transcript'}),{target:{value:instructions}});
  fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
  await screen.findByRole('button',{name:'3 · Start practicing'});
  expect(sent).toHaveLength(1);
  expect(sent[0].source_text).toBe(instructions);
  expect(sent[0].source_url).toBe(url);
 });
 it('refresh failure keeps saved practices visible and library search matches the skill category',async()=>{
  await preparePractice();const original=globalThis.fetch;let fail=false;vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{if(fail&&String(args[0]).startsWith('/v1/sessions/'))throw new Error('Offline');return original(...args);});show('library');await screen.findByRole('heading',{name:'Sketch a shaded sphere'});fireEvent.change(screen.getByRole('searchbox',{name:'Find a practice'}),{target:{value:'drawing'}});expect(screen.getByRole('heading',{name:'Sketch a shaded sphere'})).toBeTruthy();fail=true;fireEvent.click(screen.getByRole('button',{name:'Refresh library'}));await screen.findByRole('alert');expect(screen.getByRole('heading',{name:'Sketch a shaded sphere'})).toBeTruthy();fireEvent.change(screen.getByRole('searchbox',{name:'Find a practice'}),{target:{value:'not found'}});fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));expect(screen.getByRole('heading',{name:'Sketch a shaded sphere'})).toBeTruthy();
 });
 it('self-review acknowledgements carry checked observations to saved progress',async()=>{
  const {lesson,progress}=await preparePractice();show('play');
  fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}));
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);
  await screen.findByRole('heading',{name:lesson.steps[1].title!});
  expect(calls.find(call=>call.path.endsWith('/acknowledgements'))?.body?.observations).toEqual([lesson.steps[0].assessment_criteria[0]]);
  const row=await env.DB.prepare('SELECT observations FROM practice_acknowledgements WHERE session_id=?').bind(progress.session_id).first();
  expect(JSON.parse(String(row?.observations))).toEqual([lesson.steps[0].assessment_criteria[0]]);
  const saved=await(await worker.fetch(new Request('https://test.example/v1/sessions/'+progress.session_id,{headers:{Authorization:'Bearer '+progress.access_token}}),env)).json() as Progress;
  expect(saved.completed_checkpoints[0]).toMatchObject({kind:'self',observations:[lesson.steps[0].assessment_criteria[0]]});
 });
 it('shows saved self-review observations when revisiting and completing checkpoints',async()=>{
   const {lesson}=await preparePractice();show('play');
   fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
   fireEvent.click(screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}));
   fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);
   await screen.findByRole('heading',{name:lesson.steps[1].title!});
   const confirmed='Step 1 · self-reviewed — you confirmed: '+lesson.steps[0].assessment_criteria[0];
   expect(screen.queryByText(confirmed)).toBeNull();
   fireEvent.change(screen.getByRole('combobox',{name:'Checkpoint'}),{target:{value:'0'}});
   expect(await screen.findByText(confirmed)).toBeTruthy();
   fireEvent.click(screen.getByRole('button',{name:'Return to current checkpoint'}));
   await screen.findByRole('heading',{name:lesson.steps[1].title!});
   for(let i=1;i<lesson.steps.length;i++){fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);if(i+1<lesson.steps.length)await screen.findByRole('heading',{name:lesson.steps[i+1].title!});}
   await screen.findByRole('heading',{name:'A step further along.'});
   expect(screen.getByText(confirmed)).toBeTruthy();
  });
 it('learner reports carry checked observations to the team queue',async()=>{
  const {lesson}=await preparePractice();show('play');
  fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}));
  fireEvent.click(await screen.findByRole('button',{name:'Report a problem'}));
  fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Checked observations attached.'}});
  fireEvent.click(screen.getByRole('button',{name:'Send report'}));
  await screen.findByText(/Report saved for the team/);
  expect(calls.find(call=>call.path.endsWith('/reports'))?.body?.observations).toEqual([lesson.steps[0].assessment_criteria[0]]);
  const row=await env.DB.prepare('SELECT context FROM learner_reports').first();
  expect(JSON.parse(String(row?.context)).observations).toEqual([lesson.steps[0].assessment_criteria[0]]);
 });
 it('reports from a criteria-less numbered lesson carry the fallback observation',async()=>{
  const lesson=await(await worker.fetch(new Request('https://test.example/v1/lessons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_text:'1. Draw a circle on paper.\n2. Shade its lower edge.',processing_mode:'structured_text'})}),env)).json() as Lesson;
  const fallback=lesson.steps[0].assessment_criteria?.length?lesson.steps[0].assessment_criteria[0]:(lesson.steps[0].expected_visual_result||lesson.steps[0].instructions);
  await preparePractice(lesson.id);show('play');
  fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:fallback}));
  fireEvent.click(screen.getByRole('button',{name:'Report a problem'}));
  fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Numbered-lesson fallback check.'}});
  fireEvent.click(screen.getByRole('button',{name:'Send report'}));
  await screen.findByText(/Report saved for the team/);
  expect(calls.find(call=>call.path.endsWith('/reports'))?.body?.observations).toEqual([fallback]);
  const row=await env.DB.prepare('SELECT context FROM learner_reports').first();
  expect(JSON.parse(String(row?.context)).observations).toEqual([fallback]);
 });
 it('the learner report form saves its checkpoint in the team review queue without a photo',async()=>{
  const {progress}=await preparePractice();show('play');fireEvent.click(await screen.findByRole('button',{name:'Report a problem'}));fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Synthetic frontend integration check.'}});fireEvent.click(screen.getByRole('button',{name:'Send report'}));await screen.findByText(/Report saved for the team/);const row=await env.DB.prepare('SELECT step_id,details,context FROM learner_reports').first();expect(row?.step_id).toBe(progress.current_step_id);expect(row?.details).toBe('Synthetic frontend integration check.');expect(String(row?.context)).not.toContain('image_base64');expect(String(row?.context)).not.toContain(progress.access_token!);
 });
 it('a failed acknowledgement keeps the checklist and retries with the same key',async()=>{
  const {lesson,progress}=await preparePractice();show('play');
  fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  const box=screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]});fireEvent.click(box);expect((box as HTMLInputElement).checked).toBe(true);
  const original=globalThis.fetch,ackKeys:string[]=[];let fail=true;
  vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{if(String(args[0]).endsWith('/acknowledgements')){ackKeys.push(((args[1]?.headers||{}) as Record<string,string>)['Idempotency-Key']);if(fail){fail=false;throw new Error('Offline while saving');}}return original(...args);});
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);
  await screen.findByRole('alert');
  expect((screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}) as HTMLInputElement).checked).toBe(true);
  expect((await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(progress.session_id).first())?.current_index).toBe(0);
  fireEvent.click(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'})[0]);
  await screen.findByRole('heading',{name:lesson.steps[1].title!});
  expect(ackKeys).toHaveLength(2);expect(ackKeys[0]).toBeTruthy();expect(ackKeys[1]).toBe(ackKeys[0]);
  expect(calls.find(call=>call.path.endsWith('/acknowledgements'))?.body?.observations).toEqual([lesson.steps[0].assessment_criteria[0]]);
 });
 it('reporting a saved submission from another step does not attach the current checklist',async()=>{
  const {lesson,progress}=await preparePractice();
  const assessment=JSON.stringify({result:'uncertain',feedback:'Saved feedback.',corrections:[],requested_evidence:[],criteria:[]});
  await env.DB.prepare("INSERT INTO practice_submissions(id,session_id,step_id,idem_key,request_hash,status,assessment,created_at) VALUES(?,?,?,'key-current','hash-current','assessed',?,1)").bind('sub_current_step',progress.session_id,lesson.steps[0].id,assessment).run();
  await env.DB.prepare("INSERT INTO practice_submissions(id,session_id,step_id,idem_key,request_hash,status,assessment,created_at) VALUES(?,?,?,'key-other','hash-other','assessed',?,2)").bind('sub_other_step',progress.session_id,lesson.steps[1].id,assessment).run();
  show('play');
  fireEvent.click(await screen.findByRole('button',{name:'Practice with live camera · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}));
  fireEvent.click(screen.getByRole('button',{name:'View / refresh practice history'}));
  const reportButtons=await screen.findAllByRole('button',{name:'Report this feedback'});expect(reportButtons).toHaveLength(2);
  fireEvent.click(reportButtons[1]);
  fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Other step report.'}});
  fireEvent.click(screen.getByRole('button',{name:'Send report'}));
  await screen.findByText(/Report saved for the team/);
  let reports=calls.filter(call=>call.path.endsWith('/reports'));expect(reports).toHaveLength(1);expect(reports[0].body?.step_id).toBe(lesson.steps[1].id);expect(reports[0].body?.submission_id).toBe('sub_other_step');expect(reports[0].body?.observations).toEqual([]);
  fireEvent.click(screen.getByRole('button',{name:'Close report'}));
  fireEvent.click(screen.getByRole('checkbox',{name:lesson.steps[0].assessment_criteria[0]}));
  fireEvent.click((await screen.findAllByRole('button',{name:'Report this feedback'}))[0]);
  fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Current step report.'}});
  fireEvent.click(screen.getByRole('button',{name:'Send report'}));
  await screen.findByText(/Report saved for the team/);
  reports=calls.filter(call=>call.path.endsWith('/reports'));expect(reports).toHaveLength(2);expect(reports[1].body?.step_id).toBe(lesson.steps[0].id);expect(reports[1].body?.submission_id).toBe('sub_current_step');expect(reports[1].body?.observations).toEqual([lesson.steps[0].assessment_criteria[0]]);
 });
 it('clears saved camera preferences when the signed-in account changes',async()=>{
  await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);
  actor='alice';show('library');await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});
  window.localStorage.setItem('showonce-last-camera-v1','front');window.localStorage.setItem('showonce-camera-res-v1','1080');
  actor='bob';fireEvent(window,new Event('showonce-account-changed'));
  await screen.findByRole('heading',{name:'Your next practice starts here.'});
  expect(window.localStorage.getItem('showonce-last-camera-v1')).toBeNull();expect(window.localStorage.getItem('showonce-camera-res-v1')).toBeNull();
 });

});

it('keeps Professional-only course notices out of the Hobby workspace',async()=>{
 show('create');await screen.findByRole('button',{name:/Fold a paper cup/});
 expect(screen.queryByRole('link',{name:'← Professional courses'})).toBeNull();
 expect(screen.queryByText(/Classroom training only/)).toBeNull();
});
it('retains the classroom scope and Professional return link in the actual Professional player',async()=>{
 const {LessonFlow}=await import('@/components/professional/LessonFlow');window.history.replaceState(null,'','/professional/lesson/runtime/play/');
 render(<IdentityProvider><LessonFlow screen="play"/></IdentityProvider>);
 expect(screen.getByRole('link',{name:'← Professional courses'}).getAttribute('href')).toBe('/professional/lessons/');
 expect(screen.getByText(/Classroom training only/)).toBeTruthy();
 await waitFor(()=>expect(screen.queryByText('Checking your account…')).toBeNull());
});

it('starts the professional sample as real free practice and keeps its reference visual',async()=>{
 const {ProSampleStart}=await import('@/components/professional/ProSampleStart');
 render(<IdentityProvider><ProSampleStart className="sample-test"/></IdentityProvider>);
 const start=await screen.findByRole('button',{name:'Start this sample · free'});
 fireEvent.click(start);await waitFor(()=>expect(push).toHaveBeenCalled());
 const url=new URL(push.mock.calls[0][0],'https://test.example');
 expect(url.searchParams.get('lesson_id')).toBeTruthy();
 expect(calls.find(call=>call.path==='/v1/lessons')?.body?.processing_mode).toBe('structured_text');
 expect(calls.find(call=>call.path==='/v1/lessons')?.body?.source_text).toContain('point to the vertical drain pipe');
 cleanup();window.history.replaceState(null,'',url.pathname+url.search);show('play');
 expect((await screen.findByAltText('A labelled line diagram showing the vertical drain pipe running from the fixture downward.')).getAttribute('src')).toBe('/samples/plumbing/step-1.svg');
 expect((await(await worker.fetch(new Request('https://test.example/api/config'),env)).json()).budget.charged_or_reserved_usd).toBe(0);
});

it('shows only the return action when reading ahead to a self-review checkpoint',async()=>{
 const response=await fetch('/v1/lessons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_text:'1. Draw a circle on paper.\n2. Shade its lower edge.',processing_mode:'structured_text'})});
 const lesson=await response.json();await preparePractice(lesson.id);show('play');
 await screen.findByRole('combobox',{name:'Checkpoint'});
 fireEvent.change(screen.getByRole('combobox',{name:'Checkpoint'}),{target:{value:'1'}});
 await screen.findByRole('heading',{name:'Review this checkpoint.'});
 expect(screen.queryByRole('button',{name:'I’ve practiced this step · self-review'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Return to current checkpoint'}));
 expect(screen.getAllByRole('button',{name:'I’ve practiced this step · self-review'}).length).toBeGreaterThan(0);
});

it('starts the illustrated sample as real free practice and keeps its reference visual',async()=>{
 const {SampleStart}=await import('@/components/learning/SampleStart');
 render(<IdentityProvider><SampleStart className="sample-test"/></IdentityProvider>);
 const start=await screen.findByRole('button',{name:'Start practicing · free'});
 fireEvent.click(start);await waitFor(()=>expect(push).toHaveBeenCalled());
 const url=new URL(push.mock.calls[0][0],'https://test.example');
 expect(url.pathname).toBe('/lesson/runtime/play/');
 expect(url.searchParams.get('lesson_id')).not.toBe('origami-cup');
 expect(calls.find(call=>call.path==='/v1/lessons')?.body?.processing_mode).toBe('structured_text');
 expect(calls.find(call=>call.path==='/v1/sessions')?.body?.save_to_account).toBe(false);
 cleanup();window.history.replaceState(null,'',url.pathname+url.search);show('play');
 expect((await screen.findByAltText('A square sheet angled like a diamond, one corner facing down toward you.')).getAttribute('src')).toBe('/samples/origami/step-1.svg');
 expect(calls.some(call=>call.path.includes('/illustration'))).toBe(false);
 expect((await(await worker.fetch(new Request('https://test.example/api/config'),env)).json()).budget.charged_or_reserved_usd).toBe(0);
});

it('offers an explicit caption retry when visual video credits are exhausted',async()=>{
 const original=globalThis.fetch,sent:Record<string,unknown>[]=[];
 vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{
  const body=typeof args[1]?.body==='string'?JSON.parse(args[1].body):null;
  if(String(args[0])==='/api/config'){const response=await original(...args);const value=await response.json();return Response.json({...value,ai_available:true,budget:{...(value.budget||{}),remaining_usd:4,paused:false}});}
  if(String(args[0])==='/v1/lessons'&&body?.source_url){sent.push(body);if(body.learning_mode==='visual')return Response.json({error:{code:'source_free_quota_exhausted',message:'Free credits exhausted.'}},{status:429});return original(args[0],{...args[1],body:JSON.stringify({example_id:'example_draw-shading'})});}
  return original(...args);
 });
 show();await screen.findByRole('button',{name:'Start free'});
 fireEvent.change(screen.getByRole('textbox',{name:'Tutorial link'}),{target:{value:'https://www.youtube.com/watch?v=aAxGTnVNJiE'}});
 fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
 fireEvent.click(await screen.findByRole('button',{name:'Use spoken captions instead'}));
 expect(screen.getByText(/Spoken captions selected/).textContent).toContain('Visual actions are not analysed');
 expect(sent).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));await screen.findByRole('textbox',{name:'Step 1'});
 expect(sent.map(body=>body.learning_mode)).toEqual(['visual','auto']);
 expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
});

it('accepts supported mobile YouTube links while rejecting lookalike and credential URLs locally',async()=>{
 const original=globalThis.fetch,sent:Record<string,unknown>[]=[];
 vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{
  const body=typeof args[1]?.body==='string'?JSON.parse(args[1].body):null;
  if(String(args[0])==='/api/config'){const response=await original(...args);const value=await response.json();return Response.json({...value,ai_available:true,budget:{remaining_usd:4,paused:false}});}
  if(String(args[0])==='/v1/lessons'&&body?.source_url){sent.push(body);return original(args[0],{...args[1],body:JSON.stringify({example_id:'example_draw-shading'})});}
  return original(...args);
 });
 show();await screen.findByRole('button',{name:'Get the steps'});
 for(const invalid of ['https://youtube.com.attacker.example/watch?v=aAxGTnVNJiE','https://user:secret@youtube.com/watch?v=aAxGTnVNJiE','http://youtube.com/watch?v=aAxGTnVNJiE']){
  fireEvent.change(screen.getByRole('textbox',{name:'Tutorial link'}),{target:{value:invalid}});
  fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
  expect(screen.getByRole('alert')).toBeTruthy();expect(sent).toHaveLength(0);
 }
 fireEvent.change(screen.getByRole('textbox',{name:'Tutorial link'}),{target:{value:'https://m.youtube.com/watch?v=aAxGTnVNJiE'}});
 fireEvent.click(screen.getByRole('button',{name:'Get the steps'}));
 await screen.findByRole('textbox',{name:'Step 1'});
 expect(sent).toHaveLength(1);expect(sent[0].source_url).toBe('https://m.youtube.com/watch?v=aAxGTnVNJiE');
 expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
});
