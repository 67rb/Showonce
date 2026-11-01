"use client";
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useIdentity} from './Identity';
import {lessonHref,type Entry,type Lesson,type Progress} from '@/lib/learning';

export function HomePractice(){
 const identity=useIdentity(),router=useRouter();
 const {ready,account,request,guestEntries}=identity;
 const [recent,setRecent]=useState<Entry|null>(null),[nextStep,setNextStep]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(!ready)return;
  const load=async()=>{try{const entries=account?.user?(await request<{entries:Entry[]}>('/v1/library?filter=active')).entries:guestEntries().filter(entry=>entry.status!=='completed');const entry=[...entries].sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0];if(!entry){if(active){setRecent(null);setNextStep('');}return;}const progress=await request<Progress>('/v1/sessions/'+entry.id,undefined,{token:entry.token});const lesson=await request<Lesson>('/v1/lessons/'+entry.lesson_id,undefined,{token:entry.token});const step=lesson.steps.find(item=>item.id===progress.current_step_id);if(active){setRecent({...entry,completed_steps:progress.completed_step_ids.length});setNextStep(step?.title||step?.instructions||'');}}catch{if(active){setRecent(null);setNextStep('');}}};
  void load();return()=>{active=false;};
 },[ready,account,request,guestEntries]);
 async function sample(){const example=identity.config?.examples[0];if(!example||busy)return;setBusy(true);setError('');try{const lesson=await identity.request<Lesson>('/v1/lessons',{example_id:example.id,save_to_account:!!identity.account?.user});const progress=await identity.request<Progress>('/v1/sessions',{lesson_id:lesson.id,save_to_account:!!identity.account?.user});identity.remember(lesson,progress,progress.access_token);router.push(lessonHref(lesson.id,progress.session_id,'play'));}catch(e){setError(e instanceof Error?e.message:'Could not open the sample.');}finally{setBusy(false);}}
 return <div className="mt-5 flex w-full max-w-sm flex-col items-center gap-3 px-4 text-[#16161A]">
  <button type="button" onClick={()=>void sample()} disabled={!identity.ready||!identity.config?.examples.length||busy} className="min-h-11 rounded-full border border-[#16161A] bg-white/90 px-6 py-2 font-semibold disabled:opacity-60">{busy?'Opening sample…':'Try a sample lesson'}</button>
  <p className="text-sm">Free to try · no account needed</p>
  {recent&&<a className="w-full rounded-2xl border border-[#16161A]/20 bg-white/90 p-4 text-left" href={lessonHref(recent.lesson_id,recent.id,'play')}><strong>Continue practice: {recent.title}</strong><span className="mt-1 block text-sm">{recent.completed_steps} of {recent.total_steps} checkpoints completed</span>{nextStep&&<span className="mt-1 block text-sm">Next: {nextStep}</span>}<span className="mt-2 block text-sm font-semibold">Continue →</span></a>}
  {error&&<p role="alert" className="rounded-xl bg-white p-3 text-sm">{error} <a className="underline" href="/create/#examples">Choose an example</a></p>}
 </div>;
}
