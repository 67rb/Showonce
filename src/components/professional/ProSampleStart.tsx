/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useIdentity} from '@/components/learning/Identity';
import {proSampleLesson} from '@/lib/proSample';
import {lessonHref,type Lesson,type Progress} from '@/lib/learning';
import s from '@/lib/strings';

// Mirrors SampleStart for the Professional sample: Start creates real,
// self-guided paper training (structured_text) and opens the runtime player.
export function ProSampleStart({className}:{className:string}){
 const identity=useIdentity(),router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function start(){
  if(busy)return;setBusy(true);setError('');
  try{
   const lesson=await identity.request<Lesson>('/v1/lessons',{
    processing_mode:'structured_text',
    source_text:proSampleLesson.steps.map(step=>`${step.position}. ${step.instructions}`).join('\n'),
    save_to_account:!!identity.account?.user,
   });
   const progress=await identity.request<Progress>('/v1/sessions',{lesson_id:lesson.id,save_to_account:!!identity.account?.user});
   identity.remember(lesson,progress,progress.access_token);
   router.push(lessonHref(lesson.id,progress.session_id,'play'));
  }catch(e){setError(e instanceof Error?e.message:s.sampleUnavailable);setBusy(false);}
 }
 return <div><button className={className+' disabled:opacity-50'} disabled={busy||!identity.ready||identity.timedOut} aria-busy={busy} onClick={()=>void start()}>{busy?s.sampleOpening:!identity.ready?s.checkingAccount:s["proSample.start"]}</button>{identity.timedOut&&<button className="ml-3 min-h-11 underline" onClick={()=>void identity.refresh()}>{s.retry}</button>}{error&&<p role="alert" className="mt-2 text-small">{error}</p>}</div>;
}