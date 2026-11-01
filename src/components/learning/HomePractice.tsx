"use client";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useIdentity} from './Identity';
import {lessonHref,type Entry,type Lesson,type Progress} from '@/lib/learning';
import s from '@/lib/strings';

export function HomePractice(){
 const identity=useIdentity(),router=useRouter();
 const {ready,account,request,guestEntries}=identity;
 const [recent,setRecent]=useState<Entry|null>(null),[nextStep,setNextStep]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 // 5.12.8 — the sample button never sits as a silent dead disabled pill. A
 // click before the account check resolves registers as "pending"; the sample
 // opens the moment the check resolves (≤8s, 5.2). While pending the button
 // shows the loading state, and a failed navigation re-enables it with the
 // inline error below. It navigates on the first click, every time.
 const [pending,setPending]=useState(false);
 useEffect(()=>{let active=true;if(!ready)return;
  const load=async()=>{try{const entries=account?.user?(await request<{entries:Entry[]}>('/v1/library?filter=active')).entries:guestEntries().filter(entry=>entry.status!=='completed');const entry=[...entries].sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0];if(!entry){if(active){setRecent(null);setNextStep('');}return;}const progress=await request<Progress>('/v1/sessions/'+entry.id,undefined,{token:entry.token});const lesson=await request<Lesson>('/v1/lessons/'+entry.lesson_id,undefined,{token:entry.token});const step=lesson.steps.find(item=>item.id===progress.current_step_id);if(active){setRecent({...entry,completed_steps:progress.completed_step_ids.length});setNextStep(step?.title||step?.instructions||'');}}catch{if(active){setRecent(null);setNextStep('');}}};
  void load();return()=>{active=false;};
 },[ready,account,request,guestEntries]);
 async function sample(){const example=identity.config?.examples[0];if(!example||busy)return;setBusy(true);setError('');try{const lesson=await identity.request<Lesson>('/v1/lessons',{example_id:example.id,save_to_account:!!identity.account?.user});const progress=await identity.request<Progress>('/v1/sessions',{lesson_id:lesson.id,save_to_account:!!identity.account?.user});identity.remember(lesson,progress,progress.access_token);router.push(lessonHref(lesson.id,progress.session_id,'play'));}catch(e){setError(e instanceof Error?e.message:s.sampleUnavailable);}finally{setBusy(false);}}
 // A pending click runs exactly once, as soon as the account check resolves.
 // The deferred tick keeps setState out of the effect body (lint, set-state-in-effect).
 useEffect(()=>{if(!pending||!ready)return;const tick=setTimeout(()=>{if(!identity.config?.examples.length){setPending(false);setError(s.sampleUnavailable);return;}setPending(false);void sample();},0);return()=>clearTimeout(tick);},[pending,ready]);
 // Handler: always navigates — waits out the account check when needed.
 function requestSample(){if(pending||busy)return;setError('');if(ready&&identity.config?.examples.length){void sample();return;}setPending(true);}
 const working=pending||busy;
 return <div className="mt-5 flex w-full max-w-[430px] flex-col items-center gap-3 px-4 text-[#16161A]">
  <button type="button" onClick={requestSample} className="min-h-11 rounded-full border border-[#16161A] bg-white/90 px-6 py-2 font-semibold disabled:opacity-60" disabled={working}>{working?s.sampleOpening:s.trySampleLesson}</button>
  <p className="text-sm">{s.sampleFreeNote}</p>
  {recent&&<a className="w-full rounded-2xl border border-[#16161A]/20 bg-white/90 p-4 text-left" href={lessonHref(recent.lesson_id,recent.id,'play')}><strong>{s.continuePractice} {recent.title}</strong><span className="mt-1 block text-sm">{recent.completed_steps} of {recent.total_steps} checkpoints completed</span>{nextStep&&<span className="mt-1 block text-sm">{s.nextPrefix} {nextStep}</span>}<span className="mt-2 block text-sm font-semibold">{s.continueArrow}</span></a>}
  {error&&<p role="alert" className="rounded-xl bg-white p-3 text-sm">{error} <a className="underline" href="/create/#examples">{s.chooseExample}</a></p>}
 </div>;
}
