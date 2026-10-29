import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {localDB,localBucket} from './d1-local.mjs';
const [model,client,app,built]=await Promise.all(['../web/practice-library.js','../web/public-api.js','../web/app.js','../dist/server/index.js'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
const worker=(await import('data:text/javascript;base64,'+Buffer.from(built).toString('base64'))).default;
const alice={id:'alice',email:'alice@example.test'},bob={id:'bob',email:'bob@example.test'};
function backend(){
 const env={DB:localDB(),BUCKET:localBucket()};
 const request=(actor,path,body,options={})=>worker.fetch(new Request('https://test.example'+path,{method:body===undefined?'GET':'POST',headers:{Origin:'https://test.example',...(body===undefined?{}:{'Content-Type':'application/json'}),...(actor?{'oai-authenticated-user-id':actor.id,'oai-authenticated-user-email':actor.email}:{}),...(options.token?{Authorization:'Bearer '+options.token}:{}),...(options.key?{'Idempotency-Key':options.key}:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {env,request,close:()=>env.DB.close()};
}
async function ui(server,{actor=null,values=new Map(),realRender=false}={}){
 const fields=new Map(),events=new Map();let blocked=false,interceptor=null,current=actor;
 const fallback={addEventListener(){},focus(){},scrollIntoView(){},hidden:false};
 const storage={getItem:key=>values.get(key)??null,setItem(key,value){if(blocked)throw new Error('Storage full');values.set(key,value);}};
 const context=vm.createContext({window:{addEventListener(name,callback){events.set(name,callback);},scrollTo(){}},document:{querySelector:selector=>fields.get(selector)||fallback,querySelectorAll:()=>[],addEventListener(){},activeElement:null},localStorage:storage,AbortController,setTimeout,clearTimeout,crypto,navigator:{mediaDevices:{}},URL:{revokeObjectURL(){}},fetch:async(path,options)=>{
  const actor=current;
  const request=new Request('https://test.example'+path,{...options,headers:{Origin:'https://test.example',...options.headers,...(actor?{'oai-authenticated-user-id':actor.id,'oai-authenticated-user-email':actor.email}:{})}});
  const response=await worker.fetch(request,server.env);if(interceptor)await interceptor(path,actor,response);return response;
 }});
 vm.runInContext(model+'\n'+client,context);context.window.ShowOncePublic.config=()=>new Promise(()=>{});
 vm.runInContext(app+'\nthis.appTest={state,save,refreshAccount,loadAccountLibrary,loadBrowserLibrary,loadLibrary,librarySection,entry,loadLesson,resumePractice,next,home,lockAccountView,clearAccountView,accountPanel,render};'+(realRender?'':'render=()=>{};'),context);
 const api=context.appTest;api.state.config=await(await server.request(null,'/api/config')).json();
 return {api,values,fields,events,context,setActor(value){current=value;},blockStorage(){blocked=true;},intercept(callback){interceptor=callback;}};
}
const source={processing_mode:'structured_text',source_text:'Private practice\n1. Draw a circle on paper.\n2. Shade its lower edge.'};
test('account practice stays out of browser capability snapshots and resumes on another client',async()=>{
 const server=backend();try{const first=await ui(server,{actor:alice});await first.api.refreshAccount();await first.api.loadLesson(source);const token=first.api.state.session.token,id=first.api.state.session.id;assert.equal(first.api.state.screen,'overview');assert.ok(!first.values.has('showonce-practice-v2'));assert.ok(!first.values.has('showonce-library-v1'));assert.ok(!first.api.librarySection().includes(token));await first.api.next('self');const second=await ui(server,{actor:alice});await second.api.refreshAccount();await second.api.loadAccountLibrary();assert.equal(second.api.state.library[0].id,id);assert.equal(second.api.state.library[0].completed_steps,1);await second.api.resumePractice(id);assert.equal(second.api.state.index,1);assert.equal(second.api.state.session.token,null);}finally{server.close();}
});
test('switching accounts clears lessons, source drafts, history and library metadata',async()=>{
 const server=backend();try{const view=await ui(server,{actor:alice});await view.api.refreshAccount();await view.api.loadLesson(source);view.api.state.historyImage='private-photo';view.api.state.sourceDrafts.steps.source_text='Alice private draft';view.setActor(bob);await view.api.refreshAccount();await view.api.loadAccountLibrary();assert.equal(view.api.state.lesson,null);assert.equal(view.api.state.session,null);assert.equal(view.api.state.historyImage,null);assert.equal(view.api.state.sourceDrafts.steps.source_text,'');assert.equal(view.api.state.library.length,0);assert.ok(!view.api.entry().includes('Private practice'));}finally{server.close();}
});
test('an old account library response cannot appear after an account switch',async()=>{
 const server=backend();let release;try{const view=await ui(server,{actor:alice});await view.api.refreshAccount();await view.api.loadLesson(source);let entered;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);view.intercept(async(path,actor)=>{if(path.startsWith('/v1/library')&&actor?.id==='alice'){entered();await gate;}});const old=view.api.loadAccountLibrary();await ready;view.setActor(bob);await view.api.refreshAccount();await view.api.loadAccountLibrary();release();await old;assert.equal(view.api.state.library.length,0);assert.equal(view.api.state.accountProfile.user.email,bob.email);}finally{release?.();server.close();}
});
test('account lookup failure fails closed instead of rendering a previous workspace',async()=>{
 const server=backend();try{const view=await ui(server,{actor:alice});await view.api.refreshAccount();await view.api.loadLesson(source);view.api.state.sourceDrafts.steps.source_text='Private draft';view.intercept(path=>{if(path==='/api/account')throw new Error('Network interruption');});await view.api.refreshAccount();assert.equal(view.api.state.lesson,null);assert.equal(view.api.state.library.length,0);assert.equal(view.api.state.sourceDrafts.steps.source_text,'');assert.match(view.api.accountPanel(),/could not be checked/);assert.ok(!view.api.entry().includes('Private practice'));}finally{server.close();}
});
test('a signed-out browser does not show cached metadata for an imported account practice',async()=>{
 const server=backend();try{const values=new Map(),guest=await ui(server,{values});await guest.api.refreshAccount();await guest.api.loadLesson(source);const record=guest.api.state.session;const attach=await server.request(alice,'/v1/library/attach',{session_id:record.id,access_token:record.token});assert.equal(attach.status,200);const signedOut=await ui(server,{values});await signedOut.api.refreshAccount();await signedOut.api.loadBrowserLibrary();assert.equal(signedOut.api.state.library.length,0);assert.ok(values.has('showonce-library-v1'));assert.ok(!signedOut.api.entry().includes('Private practice'));}finally{server.close();}
});
test('guest library verification keeps access that could only be saved in memory',async()=>{
 const server=backend();try{const view=await ui(server);await view.api.refreshAccount();view.blockStorage();await view.api.loadLesson(source);assert.equal(view.api.state.libraryVolatile,true);view.api.state.screen='entry';view.api.loadLibrary();await view.api.loadBrowserLibrary();assert.equal(view.api.state.library.length,1);assert.equal(view.api.state.libraryVolatile,true);assert.match(view.api.librarySection(),/Keep this tab open/);}finally{server.close();}
});
test('an asynchronous account library render preserves the current form draft',async()=>{
 const server=backend();try{const view=await ui(server,{actor:alice,realRender:true});await view.api.refreshAccount();view.api.state.screen='entry';view.api.state.sourceMode='steps';view.fields.set('[name="source-mode"]:checked',{value:'steps'});view.fields.set('#tutorial-text',{value:'1. Keep this unfinished draft.\n2. Finish it later.'});view.fields.set('#reference-url',{value:''});await view.api.loadAccountLibrary();assert.equal(view.api.state.sourceDrafts.steps.source_text,'1. Keep this unfinished draft.\n2. Finish it later.');}finally{server.close();}
});

test('account verification cannot resurface private lesson content or its navigation',async()=>{const server=backend();try{const view=await ui(server,{actor:alice});await view.api.refreshAccount();await view.api.loadLesson(source);const main={innerHTML:'Private lesson'},nav={innerHTML:'Private navigation'};view.fields.set('#main',main);view.fields.set('#lesson-nav',nav);view.api.lockAccountView();view.api.render(false);assert.ok(!main.innerHTML.includes('Private practice'));assert.match(main.innerHTML,/Checking your account/);assert.equal(nav.innerHTML,'');}finally{server.close();}});
