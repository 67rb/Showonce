/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useIdentity} from './Identity';
import {origamiSample} from '@/lib/sample';
import {lessonHref,type Lesson,type Progress} from '@/lib/learning';
import s from '@/lib/strings';

// The static overview stays public. Start creates real free, self-guided
// practice rather than linking to a sample ID unknown to the backend.
export function SampleStart({className}:{className:string}){
 const identity=useIdentity(),router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function start(){
  if(busy)return;setBusy(true);setError('');
  try{
   const lesson=await identity.request<Lesson>('/v1/lessons',{
    processing_mode:'structured_text',
    source_text:origamiSample.steps.map((step,i)=>`${i+1}. ${step.instructions}`).join('\n'),
    save_to_account:!!identity.account?.user,
   });
   const progress=await identity.request<Progress>('/v1/sessions',{lesson_id:lesson.id,save_to_account:!!identity.account?.user});
   identity.remember(lesson,progress,progress.access_token);
   router.push(lessonHref(lesson.id,progress.session_id,'play'));
  }catch(e){setError(e instanceof Error?e.message:s.sampleUnavailable);setBusy(false);}
 }
 return <div><button className={className+' disabled:opacity-50'} disabled={busy||!identity.ready||identity.timedOut} aria-busy={busy} onClick={()=>void start()}>{busy?s.sampleOpening:!identity.ready?s.checkingAccount:s['sample.start']}</button>{identity.timedOut&&<button className="ml-3 min-h-11 underline" onClick={()=>void identity.refresh()}>Retry connection</button>}{error&&<p role="alert" className="mt-2 text-small">{error}</p>}</div>;
}
