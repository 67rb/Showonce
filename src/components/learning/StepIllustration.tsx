/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {LearningError,aiChecksAvailable,type Step} from '@/lib/learning';
import {illustrationKey,writeIllustration} from '@/lib/illustration-cache';
import {origamiSample} from '@/lib/sample';
import {useIdentity} from './Identity';

/** Reading a saved image never starts a billable generation request. */
export function StepIllustration({lessonID,step,token,disabled=false,onPrepare}:{lessonID:string;step:Step;token:string|null;disabled?:boolean;onPrepare:()=>void}){
 const identity=useIdentity();
 const savedSample=origamiSample.steps.find(item=>item.instructions===step.instructions);
 const [image,setImage]=useState<string|null>(null),[state,setState]=useState<'loading'|'missing'|'generating'|'ready'|'error'>('loading'),[error,setError]=useState<string|null>(null);
 const lifetime=useRef<AbortController|null>(null),objectURL=useRef<string|null>(null),inFlight=useRef(false);
 const path='/v1/lessons/'+encodeURIComponent(lessonID)+'/steps/'+encodeURIComponent(step.id)+'/illustration';
 const load=useCallback(async(signal:AbortSignal)=>{
  const key=illustrationKey(lessonID,step.id);
  try{const blob=await identity.request<Blob>(path+'/image',undefined,{token,image:true,signal});
   if(signal.aborted)return false;
   writeIllustration(key,{status:'ready',blob});
   const url=URL.createObjectURL(blob);if(objectURL.current)URL.revokeObjectURL(objectURL.current);objectURL.current=url;setImage(url);setState('ready');return true;
  }catch(e){if(signal.aborted)return false;if(e instanceof LearningError&&e.status===404){writeIllustration(key,{status:'missing'});setState('missing');return false;}throw e;}
 },[identity.request,path,token,lessonID,step.id]);
 useEffect(()=>{
  if(savedSample)return;
  const controller=new AbortController();lifetime.current=controller;
  void load(controller.signal).catch(e=>{if(!controller.signal.aborted){setState('error');setError(e instanceof Error?e.message:'The saved image could not be loaded.');}});
  return()=>{controller.abort();if(objectURL.current)URL.revokeObjectURL(objectURL.current);};
 },[load,savedSample]);
 async function generate(){
  const controller=lifetime.current;if(!controller||controller.signal.aborted||inFlight.current||disabled)return;
  inFlight.current=true;setState('generating');setError(null);onPrepare();
  try{const result=await identity.request<{status:string}>(path,{}, {token,signal:controller.signal});
   if(controller.signal.aborted)return;
   for(let attempt=0;attempt<30;attempt++){
    if(result.status==='ready'||attempt>0){if(await load(controller.signal))return;}
    if(controller.signal.aborted)return;setState('generating');
    await new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,3000);controller.signal.addEventListener('abort',finish,{once:true});});
   }
   throw new Error('The illustration is still processing. Reopen this step shortly to load it without another charge.');
  }catch(e){if(!controller.signal.aborted){setState('error');setError(e instanceof Error?e.message:'Illustration unavailable. Follow the written target.');}}
  finally{inFlight.current=false;}
 }
 if(savedSample)return <figure className="mt-4"><img className="max-h-96 w-full rounded-xl bg-white object-contain" src={savedSample.visual} alt={savedSample.target} width={420} height={320}/><figcaption className="mt-2 text-small text-site-muted">Saved sample reference illustration</figcaption></figure>;
 if(image)return <figure className="mt-4"><img className="max-h-96 w-full rounded-xl bg-white object-contain" src={image} alt={'AI illustration: '+step.expected_visual_result}/><figcaption className="mt-2 text-small text-site-muted">AI illustration · may contain visual inaccuracies</figcaption></figure>;
 const canGenerate=aiChecksAvailable(identity.config);
 return <div className="mt-4 rounded-xl border border-site-border bg-white p-4">
  <p role="status" className="text-small text-site-muted">{state==='loading'?'Loading saved step image…':state==='generating'?'Creating and checking your step image… This uses the AI allowance.':state==='error'?error:'No image has been saved for this step yet.'}</p>
  {state!=='loading'&&state!=='generating'&&<><button type="button" disabled={disabled||!canGenerate} onClick={()=>void generate()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-center font-semibold text-[#16161A] disabled:opacity-50">Generate step image · uses AI allowance</button><p className="mt-2 text-small text-site-muted">Saved images reload automatically. {canGenerate?'Create an image for this checkpoint with Meta AI.':'New image generation is currently unavailable.'}</p></>}
 </div>;
}
