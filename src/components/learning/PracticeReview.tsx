"use client";
import {useState} from 'react';
import type {Lesson,Progress} from '@/lib/learning';

const button='min-h-11 rounded-full border border-site-border-2 bg-white px-4 py-2 text-small font-semibold text-site-ink disabled:opacity-50';

export function buildPracticeRecap(lesson:Lesson,progress:Progress){
 const completed=new Set(progress.completed_step_ids);
 return ['SHOW ONCE — Practice recap',lesson.title,`${lesson.steps.filter(step=>completed.has(step.id)).length} of ${lesson.steps.length} checkpoints practiced`,'',...lesson.steps.map((step,index)=>`${index+1}. ${step.title||step.instructions} — ${completed.has(step.id)?'practiced':'not yet practiced'}`),'','Practice progress records activity; it does not certify competence or safety.'].join('\n');
}

export function PracticeReview({lesson,progress}:{lesson:Lesson;progress:Progress}){
 const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[ratings,setRatings]=useState<Record<string,'remembered'|'revisit'>>({}),[error,setError]=useState('');
 const completed=lesson.steps.filter(step=>progress.completed_step_ids.includes(step.id));
 const current=completed[Math.min(index,Math.max(0,completed.length-1))];
 const remembered=completed.filter(step=>ratings[step.id]==='remembered').length,revisit=completed.filter(step=>ratings[step.id]==='revisit').length;
 function move(next:number){setIndex(Math.max(0,Math.min(next,completed.length-1)));setRevealed(false);}
 function download(){let url='';try{url=URL.createObjectURL(new Blob([buildPracticeRecap(lesson,progress)],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='showonce-practice-recap.txt';link.click();setError('');}catch{setError('Could not create the recap on this device.');}finally{if(url)window.setTimeout(()=>URL.revokeObjectURL(url),1000);}}
 return <section className="rounded-[24px] border border-site-border bg-white p-5" aria-labelledby="practice-review-heading"><h2 id="practice-review-heading" className="text-xl font-semibold">Recall and recap</h2>
  <details className="mt-4"><summary className="cursor-pointer font-semibold">Rehearse from memory</summary><p className="mt-2 text-small text-site-muted">Recall a completed checkpoint, reveal its instructions, then decide whether to revisit it. Your choices stay on this page and do not change your practice progress.</p>
   {!current?<p className="mt-4 text-small">Complete a checkpoint to create your first rehearsal card.</p>:<div className="mt-4 space-y-3"><p className="text-small font-semibold">Card {Math.min(index,completed.length-1)+1} of {completed.length}</p><p>What did you do in checkpoint {lesson.steps.findIndex(step=>step.id===current.id)+1}?</p>{revealed?<div className="rounded-2xl bg-site-page p-4"><strong>{current.title||'Checkpoint instructions'}</strong><p className="mt-2 whitespace-pre-wrap">{current.instructions}</p></div>:<button type="button" className={button} onClick={()=>setRevealed(true)}>Reveal instructions</button>}{revealed&&<div className="flex flex-wrap gap-2"><button type="button" className={button} aria-pressed={ratings[current.id]==='remembered'} onClick={()=>setRatings(previous=>({...previous,[current.id]:'remembered'}))}>I remembered</button><button type="button" className={button} aria-pressed={ratings[current.id]==='revisit'} onClick={()=>setRatings(previous=>({...previous,[current.id]:'revisit'}))}>Revisit later</button></div>}<p role="status" className="text-small text-site-muted">{remembered} remembered · {revisit} to revisit</p><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={index===0} onClick={()=>move(index-1)}>Previous card</button><button type="button" className={button} disabled={index>=completed.length-1} onClick={()=>move(index+1)}>Next card</button></div></div>}
  </details><div className="mt-5 border-t border-site-border pt-5"><h3 className="font-semibold">Take a recap with you</h3><p className="mt-2 text-small text-site-muted">Download a text summary of checkpoint titles and progress. If a checkpoint has no title, its instruction is included. Notes, photos and private access links are not included.</p><button type="button" className={button+' mt-3'} onClick={download}>Download practice recap</button>{error&&<p role="alert" className="mt-2 text-small">{error}</p>}</div>
 </section>;
}
