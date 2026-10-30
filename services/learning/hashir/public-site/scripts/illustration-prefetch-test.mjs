/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
function harness(){
 const pending=[],images=[],painted=[];
 const state={screen:'overview',index:0,lesson:{id:'lesson',steps:['a','b','c','d'].map(id=>({id}))},session:{id:'session',token:'private'},accountBusy:false};
 const context=vm.createContext({state,accountUser:()=>null,step:()=>state.lesson.steps[state.index],h:String,render:()=>painted.push(state.index),queueMicrotask,setTimeout,URL:{createObjectURL:()=>`blob:${images.length}`},window:{ShowOncePublic:{request:(path,body,options)=>new Promise((resolve,reject)=>pending.push({path,options,resolve,reject})),image:async(path,token)=>{images.push({path,token});return {};}}}});
 vm.runInContext(app.slice(app.indexOf('const targetImages=new Map();'))+';this.subject={loadTargetIllustration,targetIllustration,targetImages};',context);
 return {state,pending,images,painted,...context.subject};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('overview starts current and next images before any next-step click, then fills the background queue',async()=>{const f=harness();f.loadTargetIllustration();assert.deepEqual(f.pending.map(x=>x.path),['/v1/lessons/lesson/steps/a/illustration','/v1/lessons/lesson/steps/b/illustration']);f.loadTargetIllustration();assert.equal(f.pending.length,2);f.pending[1].resolve({status:'ready'});await flush();assert.equal(f.pending.length,3);assert.match(f.pending[2].path,/steps\/c\//);assert.equal(f.images[0].token,'private');f.state.screen='step';f.state.index=1;assert.match(f.targetIllustration(),/blob:1/);f.loadTargetIllustration();assert.equal(f.pending.length,3);});
test('rapid navigation reuses an in-flight next image and paints only the matching checkpoint',async()=>{const f=harness();f.loadTargetIllustration();f.state.screen='step';f.state.index=1;f.loadTargetIllustration();assert.equal(f.pending.length,2);f.pending[0].resolve({status:'ready'});await flush();assert.equal(f.painted.length,0);f.pending[1].resolve({status:'ready'});await flush();assert.deepEqual(f.painted,[1]);assert.match(f.targetIllustration(),/AI illustration/);});
test('leaving practice or changing account stops new work and discards stale image responses',async()=>{for(const mode of ['leave','account']){const f=harness();f.loadTargetIllustration();if(mode==='leave')f.state.screen='entry';else f.state.accountBusy=true;f.pending.forEach(p=>p.resolve({status:'ready'}));await flush();assert.equal(f.pending.length,2);assert.equal(f.images.length,0);assert.equal(f.painted.length,0);}});
test('background errors do not replace current target or restart a failed billable job',async()=>{const f=harness();f.loadTargetIllustration();f.state.screen='step';f.pending[1].reject(new Error('Quality check failed'));await flush();assert.equal(f.painted.length,0);assert.equal(f.pending.length,3);f.loadTargetIllustration();assert.equal(f.pending.length,3);assert.ok(!f.targetIllustration().includes('Quality check failed'));f.state.screen='entry';});
