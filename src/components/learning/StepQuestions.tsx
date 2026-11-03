/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {aiChecksAvailable,type Step} from '@/lib/learning';
import {useIdentity} from './Identity';

type Answer={answer:string;basis:'step_instructions'|'general_explanation'|'not_enough_context';source_quote:string;limitations:string[]};
export type QuestionRecord={id:string;request_key:string;step_id:string;question:string;status:'processing'|'answered'|'failed';answer:Answer|null;error_code:string|null;created_at:string};
type Props={sessionID:string;step:Step;token:string|null;disabled?:boolean};
const button='inline-flex min-h-11 items-center justify-center rounded-full border border-site-border-2 bg-white px-4 py-3 text-center text-small font-semibold text-site-ink disabled:opacity-50';

export function StepQuestions({sessionID,step,token,disabled=false}:Props){
 const identity=useIdentity(),[question,setQuestion]=useState(''),[records,setRecords]=useState<QuestionRecord[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[retrying,setRetrying]=useState(false);
 const [recovery,setRecovery]=useState<'load'|QuestionRecord|null>(null);
 const mounted=useRef(true),pending=useRef<{key:string;body:{step_id:string;question:string}}|null>(null),write=useRef<AbortController|null>(null),read=useRef<AbortController|null>(null),sequence=useRef(0);
 const path='/v1/sessions/'+encodeURIComponent(sessionID)+'/questions';
 const load=useCallback(async()=>{
  const id=++sequence.current;read.current?.abort();const controller=new AbortController();read.current=controller;setLoading(true);setError(null);setRecovery(null);
  try{const result=await identity.request<{questions:QuestionRecord[]}>(path+'?step_id='+encodeURIComponent(step.id),undefined,{token,signal:controller.signal});if(!mounted.current||id!==sequence.current)return;setRecords(result.questions);
   if(pending.current){const saved=result.questions.find(item=>item.request_key===pending.current?.key&&item.step_id===step.id&&item.status!=='processing');if(saved){pending.current=null;setRetrying(false);if(saved.status==='answered')setQuestion('');}}
  }catch(e){if(mounted.current&&!controller.signal.aborted){setError(e instanceof Error?e.message:'Saved answers could not be loaded.');setRecovery('load');}}
  finally{if(mounted.current&&id===sequence.current)setLoading(false);}
 },[identity.request,path,step.id,token]);
 useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false;sequence.current++;read.current?.abort();write.current?.abort();};},[load]);
 async function ask(){
  if(disabled||loading||busy||!aiChecksAvailable(identity.config)||!question.trim())return;
  pending.current||={key:crypto.randomUUID(),body:{step_id:step.id,question:question.trim()}};setRetrying(true);setBusy(true);setError(null);setRecovery(null);const controller=new AbortController();write.current=controller;
  try{const result=await identity.request<{record:QuestionRecord}>(path,pending.current.body,{token,key:pending.current.key,signal:controller.signal});if(!mounted.current||controller.signal.aborted)return;
   setRecords(previous=>[...previous.filter(item=>item.id!==result.record.id),result.record]);
   if(result.record.status!=='processing'){pending.current=null;setRetrying(false);if(result.record.status==='answered')setQuestion('');}
   if(result.record.status==='failed')setError('That request did not produce an answer. A sent AI request may still use allowance. You can type a new question.');
  }catch(e){if(mounted.current){setError(controller.signal.aborted?'Stopped waiting. The answer may still finish. Refresh saved answers or retry the same question to retrieve it.':e instanceof Error?e.message:'The answer could not be retrieved. Retry the same question.');}}
  finally{if(mounted.current)setBusy(false);}
 }
 async function remove(item:QuestionRecord){
  if(disabled||loading||busy||item.status==='processing')return;setBusy(true);setError(null);setRecovery(null);const controller=new AbortController();write.current=controller;
  try{await identity.request(path+'/'+encodeURIComponent(item.id),undefined,{method:'DELETE',token,signal:controller.signal});if(mounted.current)setRecords(previous=>previous.filter(row=>row.id!==item.id));}
  catch(e){if(mounted.current&&!controller.signal.aborted){setError(e instanceof Error?e.message:'The question could not be deleted.');setRecovery(item);}}
  finally{if(mounted.current)setBusy(false);}
 }
 const waiting=records.some(item=>item.status==='processing'),available=aiChecksAvailable(identity.config);
 return <section aria-label="Questions about this step" className="mt-6 space-y-4 border-t border-site-border pt-5">
  <div><h3 className="text-xl font-semibold">Ask about this step</h3><p className="mt-2 text-small text-site-muted">Get an explanation using this step’s instructions. Text questions don’t inspect your camera or pictures; use a photo check for visual feedback.</p></div>
  <form aria-busy={busy} onSubmit={event=>{event.preventDefault();void ask();}} className="space-y-3">
   <label className="block text-small font-semibold">Your question<textarea className="mt-2 w-full rounded-2xl border border-site-border-2 bg-white p-4 font-normal text-site-ink" rows={3} maxLength={1500} placeholder="What does this instruction mean?" value={question} readOnly={retrying} disabled={busy||disabled} onChange={event=>setQuestion(event.target.value)} required/></label>
   <p className="text-small text-site-muted">Questions and answers are saved privately with this practice. Sending a question uses the existing AI allowance.</p>
   <button type="submit" className={button+' w-full bg-accent'} disabled={loading||busy||disabled||!available||!question.trim()||waiting&&!retrying}>{busy?'Working…':retrying?'Retry same question':'Ask AI · uses allowance'}</button>
   {busy&&<button type="button" className="min-h-11 text-small underline" onClick={()=>write.current?.abort()}>Stop waiting</button>}
   {retrying&&!busy&&<button type="button" className="min-h-11 text-small underline" onClick={()=>{pending.current=null;setRetrying(false);setQuestion('');}}>Start a new question</button>}
   {!available&&<p className="text-small text-site-muted">AI answers are currently unavailable. You can still read the step and any saved answers.</p>}
  </form>
  {error&&<div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-small">{error}{recovery&&!busy&&!loading&&<button type="button" className="mt-2 min-h-11 text-site-ink underline" disabled={disabled} onClick={()=>void(recovery==='load'?load():remove(recovery))}>{recovery==='load'?'Retry loading saved answers':'Retry deleting question'}</button>}</div>}
  {loading&&<p role="status" className="text-small text-site-muted">Loading saved answers…</p>}
  <div aria-live="polite" aria-relevant="additions text" className="space-y-4">{records.map(item=><article key={item.id} className="rounded-2xl border border-site-border bg-site-page p-4">
   <p className="whitespace-pre-wrap text-small font-semibold">{item.question}</p>
   {item.status==='answered'&&item.answer?<><p className="mt-3 whitespace-pre-wrap text-small">{item.answer.answer}</p><p className="mt-3 text-caption text-site-muted">{item.answer.basis==='step_instructions'?'Based on the lesson instructions':item.answer.basis==='general_explanation'?'General explanation':'More context is needed'} · AI explanation</p>{item.answer.source_quote&&<blockquote className="mt-3 border-l-2 border-accent pl-3 text-small text-site-muted">{item.answer.source_quote}</blockquote>}{item.answer.limitations.map((limit,index)=><p key={index} className="mt-2 text-small text-site-muted">{limit}</p>)}</>:<p role="status" className="mt-3 text-small text-site-muted">{item.status==='processing'?'An answer is processing. Refresh saved answers to retrieve it.':'This request did not produce an answer. A sent AI request may still use allowance.'}</p>}
   {item.status!=='processing'&&<button type="button" className="mt-3 min-h-11 text-small underline" disabled={loading||busy||disabled} onClick={()=>void remove(item)}>Delete question and answer</button>}
  </article>)}</div>
  <button type="button" className={button} disabled={loading||busy||disabled} onClick={()=>void load()}>Refresh saved answers</button>
  <p className="text-caption text-site-muted">Answers explain the lesson; they don’t pass a checkpoint or certify your work.</p>
 </section>;
}

/** Overview histories load only when the learner opens a step's question box. */
export function StepQuestionToggle(props:Props){const [open,setOpen]=useState(false);return <details className="mt-3 text-small" onToggle={event=>setOpen(event.currentTarget.open)}><summary className="cursor-pointer underline">Ask about this step</summary>{open&&<StepQuestions {...props}/>}</details>;}
