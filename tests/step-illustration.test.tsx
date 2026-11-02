/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import {StepIllustration,StepIllustrationPrefetch} from '@/components/learning/StepIllustration';
import {LearningError,type Step} from '@/lib/learning';
import {illustrationKey,readIllustration,clearIllustrationCache,writeIllustration} from '@/lib/illustration-cache';

const {request,config}=vi.hoisted(()=>({request:vi.fn(),config:{ai_available:true,budget:{remaining_usd:4,paused:false}}}));
vi.mock('@/components/learning/Identity',()=>({useIdentity:()=>({request,config})}));
const step:Step={id:'step_1',position:1,instructions:'Draw a light circle on paper.',expected_visual_result:'One light circle is visible.',assessment_criteria:['A circle is visible'],visual_limits:[]};
const nextStep:Step={...step,id:'step_2',position:2,instructions:'Shade the lower edge of the circle.',expected_visual_result:'The lower edge is shaded.'};

beforeEach(()=>{request.mockReset();clearIllustrationCache();config.ai_available=true;config.budget.remaining_usd=4;config.budget.paused=false;
 vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=>'blob:target');static revokeObjectURL=vi.fn();});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe('step illustration timing',()=>{
 it('generates the current step image automatically when none is saved, without a click',async()=>{
  let generated=false;
  request.mockImplementation(async(path:string,body?:unknown,options?:{image?:boolean})=>{
   if(path.endsWith('/image')){
    if(!generated)throw new LearningError('No image yet','image_not_ready',404);
    return new Blob(['img'],{type:'image/png'});
   }
   if(body!==undefined){generated=true;return {status:'ready'};}
   throw new Error('Unexpected '+path);
  });
  render(<StepIllustration lessonID="lesson_1" step={step} token={null} onPrepare={()=>{}}/>);
  const img=await screen.findByRole('img',{name:'AI illustration: One light circle is visible.'});
  expect(img.getAttribute('src')).toBe('blob:target');
  const posts=request.mock.calls.filter(call=>call[1]!==undefined);
  expect(posts).toHaveLength(1);
  expect(posts[0][0]).toBe('/v1/lessons/lesson_1/steps/step_1/illustration');
 });
 it('does not generate when the AI allowance is unavailable',async()=>{
  config.ai_available=false;
  request.mockImplementation(async()=>{throw new LearningError('No image yet','image_not_ready',404);});
  render(<StepIllustration lessonID="lesson_1" step={step} token={null} onPrepare={()=>{}}/>);
  expect(await screen.findByRole('button',{name:'Generate step image · uses AI allowance'})).toBeTruthy();
  expect(request.mock.calls.filter(call=>call[1]!==undefined)).toHaveLength(0);
 });
 it('prefetches the next step image in the background into the shared cache',async()=>{
  request.mockImplementation(async(path:string,body?:unknown,options?:{image?:boolean})=>{
   if(options?.image)return new Blob(['next'],{type:'image/png'});
   if(body!==undefined)return {status:'ready'};
   throw new Error('Unexpected '+path);
  });
  render(<StepIllustrationPrefetch lessonID="lesson_1" step={nextStep} token={null}/>);
  await waitFor(()=>expect(readIllustration(illustrationKey('lesson_1','step_2'))?.status).toBe('ready'));
  const posts=request.mock.calls.filter(call=>call[1]!==undefined);
  expect(posts).toHaveLength(1);
  expect(posts[0][0]).toBe('/v1/lessons/lesson_1/steps/step_2/illustration');
 });
 it('prefetch stays silent and never retries when generation fails',async()=>{
  request.mockImplementation(async()=>{throw new Error('provider down');});
  const view=render(<StepIllustrationPrefetch lessonID="lesson_9" step={{...nextStep,id:'step_9'}} token={null}/>);
  await waitFor(()=>expect(request.mock.calls.filter(call=>call[1]!==undefined)).toHaveLength(1));
  await new Promise(resolve=>setTimeout(resolve,50));
  expect(request.mock.calls.filter(call=>call[1]!==undefined)).toHaveLength(1);
  expect(view.container.textContent).toBe('');
 });
});
