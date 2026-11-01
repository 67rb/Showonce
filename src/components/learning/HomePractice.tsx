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
 useEffect(()=>{let active=true;if(!ready)return;
  const load=async()=>{try{const entries=account?.user?(await request<{entries:Entry[]}>('/v1/library?filter=active')).entries:guestEntries().filter(entry=>entry.status!=='completed');const entry=[...entries].sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0];if(!entry){if(active){setRecent(null);setNextStep('');}return;}const progress=await request<Progress>('/v1/sessions/'+entry.id,undefined,{token:entry.token});const lesson=await request<Lesson>('/v1/lessons/'+entry.lesson_id,undefined,{token:entry.token});const step=lesson.steps.find(item=>item.id===progress.current_step_id);if(active){setRecent({...entry,completed_steps:progress.completed_step_ids.length});setNextStep(step?.title||step?.instructions||'');}}catch{if(active){setRecent(null);setNextStep('');}}};
  void load();return()=>{active=false;};
 },[ready,account,request,guestEntries]);
 // 5.1.0 — "Try a sample lesson" always navigates on the first click, straight
 // to the public /lesson/sample overview. It is NOT gated behind the account
 // check or the backend lesson-creation path, and it never posts a request in
 // the click path. The destination owns its own loading state. A failed
 // navigation still surfaces as an inline error and re-enables the button.
 function requestSample(){if(busy)return;setBusy(true);setError('');try{router.push('/lesson/sample');}catch(e){setError(e instanceof Error?e.message:s.sampleUnavailable);setBusy(false);}}
 const working=busy;
 return <div className="mt-5 flex w-full max-w-[430px] flex-col items-center gap-3 px-4 text-[#16161A]">
  <button type="button" onClick={requestSample} aria-busy={working} className="min-h-11 rounded-full border border-[#16161A] bg-white/90 px-6 py-2 font-semibold disabled:opacity-60" disabled={working}>{working?s.sampleOpening:s.trySampleLesson}</button>
  <p className="text-sm">{s.sampleFreeNote}</p>
  {recent&&<a className="w-full rounded-2xl border border-[#16161A]/20 bg-white/90 p-4 text-left" href={lessonHref(recent.lesson_id,recent.id,'play')}><strong>{s.continuePractice} {recent.title}</strong><span className="mt-1 block text-sm">{recent.completed_steps} of {recent.total_steps} checkpoints completed</span>{nextStep&&<span className="mt-1 block text-sm">{s.nextPrefix} {nextStep}</span>}<span className="mt-2 block text-sm font-semibold">{s.continueArrow}</span></a>}
  {identity.timedOut&&<button type="button" className="min-h-11 rounded-full bg-white px-5 py-2 font-semibold underline" onClick={()=>void identity.refresh()}>{s.retry}</button>}
  {error&&<p role="alert" className="rounded-xl bg-white p-3 text-sm">{error} <a className="underline" href="/create/#examples">{s.chooseExample}</a></p>}
 </div>;
}
