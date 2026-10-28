// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import path from 'node:path';
import {webcrypto} from 'node:crypto';
import worker from '../services/learning/hashir/public-site/dist/server/index.js';
import {localDB,localBucket} from '../services/learning/hashir/public-site/scripts/d1-local.mjs';
import {IdentityProvider} from '@/components/learning/Identity';
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
describe('working frontend with the actual learning Worker',()=>{
 it('creates a free lesson from entered instructions and saves a real resumable practice',async()=>{
  show();await screen.findByRole('button',{name:'Free numbered steps'});fireEvent.click(screen.getByRole('button',{name:'Free numbered steps'}));fireEvent.change(screen.getByRole('textbox',{name:'2–18 numbered instructions'}),{target:{value:'1. Draw a circle on paper.\n2. Shade its lower edge.'}});fireEvent.click(screen.getByRole('button',{name:'Create free practice'}));await waitFor(()=>expect(push).toHaveBeenCalled());
  expect(calls.find(call=>call.path==='/v1/lessons')?.body?.processing_mode).toBe('structured_text');expect(calls.find(call=>call.path==='/v1/sessions')?.body?.save_to_account).toBe(false);expect(push.mock.calls[0][0]).toMatch(/^\/lesson\/runtime\/\?lesson_id=lesson_/);const saved=JSON.parse(window.localStorage.getItem('showonce-library-v1')!);expect(saved.entries).toHaveLength(1);expect(saved.entries[0].token).toBeTruthy();expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM practice_sessions').first())?.count).toBe(1);expect((await env.DB.prepare('SELECT calls FROM ai_budget WHERE id=1').first())?.calls).toBe(0);
 });
 it('account practices never write a private capability into browser snapshots',async()=>{
  actor='alice';show();await screen.findByRole('button',{name:/Fold a paper cup/});fireEvent.click(screen.getByRole('button',{name:/Fold a paper cup/}));await waitFor(()=>expect(push).toHaveBeenCalled());expect(window.localStorage.getItem('showonce-library-v1')).toBeNull();const session=await env.DB.prepare('SELECT owner_id FROM practice_sessions').first();expect(session?.owner_id).toBeTruthy();expect(calls.find(call=>call.path==='/v1/sessions')?.headers['X-ShowOnce-Account']).toMatch(/^account_/);
 });
 it('the account library renders server records rather than design fixtures',async()=>{
  actor='alice';let response=await worker.fetch(new Request('https://test.example/api/account',{headers:{'oai-authenticated-user-id':actor,'oai-authenticated-user-email':'alice@example.test'}}),env);expect(response.status).toBe(200);response=await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':actor,'oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);expect(response.status).toBe(201);show('library');await screen.findByRole('heading',{name:'Practice a steady guitar rhythm'});expect(screen.queryByText('The stepped tower')).toBeNull();expect(screen.getByRole('link',{name:'Continue practice'}).getAttribute('href')).toContain('session_id=');
 });
 it('a different signed-in account sees none of the previous account practices',async()=>{
  await worker.fetch(new Request('https://test.example/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.test'},body:JSON.stringify({lesson_id:'example_guitar-rhythm',save_to_account:true})}),env);actor='bob';show('library');await screen.findByRole('heading',{name:'Your next practice starts here.'});expect(screen.queryByRole('heading',{name:'Practice a steady guitar rhythm'})).toBeNull();
 });
 it('a denied server practice cannot display fixture progress or offer a false completion',async()=>{
  window.history.replaceState(null,'','/lesson/runtime/play/?lesson_id=example_draw-shading&session_id=session_missing');show('play');await screen.findByRole('alert');expect(screen.queryByText('A step further along.')).toBeNull();expect(screen.queryByRole('button',{name:/self-review/})).toBeNull();
 });
 it('lesson URLs contain identifiers and never a private access token',()=>{const url=lessonHref('lesson_a','session_b','play');expect(url).toBe('/lesson/runtime/play/?lesson_id=lesson_a&session_id=session_b');expect(url).not.toContain('token');});
 it('unsupported and oversized photos fail locally before any network check',async()=>{await expect(photoData(new File(['text'],'work.txt',{type:'text/plain'}))).rejects.toThrow(/PNG/);await expect(photoData(new File([new Uint8Array(5242881)],'work.png',{type:'image/png'}))).rejects.toThrow(/5 MiB/);expect(calls).toHaveLength(0);});
 it('a lost acknowledgement reply retries the same key and advances only once',async()=>{
  const {lesson,progress}=await preparePractice();const original=globalThis.fetch;let lose=true;vi.stubGlobal('fetch',async(...args:Parameters<typeof fetch>)=>{const response=await original(...args);if(String(args[0]).endsWith('/acknowledgements')&&lose){lose=false;throw new Error('Reply lost after commit.');}return response;});show('play');const button=await screen.findByRole('button',{name:'I’ve practiced this step · self-review'});fireEvent.click(button);await screen.findByRole('alert');expect((await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(progress.session_id).first())?.current_index).toBe(1);fireEvent.click(screen.getByRole('button',{name:'I’ve practiced this step · self-review'}));await screen.findByRole('heading',{name:lesson.steps[1].title||'Try this step'});const retries=calls.filter(call=>call.path.endsWith('/acknowledgements'));expect(retries).toHaveLength(2);expect(retries[0].headers['Idempotency-Key']).toBe(retries[1].headers['Idempotency-Key']);expect((await env.DB.prepare('SELECT current_index FROM practice_sessions WHERE id=?').bind(progress.session_id).first())?.current_index).toBe(1);
 });
 it('the learner report form saves its checkpoint in the team review queue without a photo',async()=>{
  const {progress}=await preparePractice();show('play');fireEvent.click(await screen.findByRole('button',{name:'Report a problem'}));fireEvent.change(screen.getByRole('textbox',{name:'What went wrong?'}),{target:{value:'Synthetic frontend integration check.'}});fireEvent.click(screen.getByRole('button',{name:'Send report'}));await screen.findByText(/Report saved for the team/);const row=await env.DB.prepare('SELECT step_id,details,context FROM learner_reports').first();expect(row?.step_id).toBe(progress.current_step_id);expect(row?.details).toBe('Synthetic frontend integration check.');expect(String(row?.context)).not.toContain('image_base64');expect(String(row?.context)).not.toContain(progress.access_token!);
 });
});
