/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useEffect,useState} from 'react';
import {VerdictChip} from '@/components/VerdictChip';
import {origamiSample} from '@/lib/sample';
import {proSampleLesson} from '@/lib/proSample';
import s from '@/lib/strings';

type FState = 'checking'|'right'|'wrong'|'canttell';
const banner='border border-site-border bg-white p-4 text-sm text-site-ink';

export function SampleFixture({face,screen}:{face:'hobby'|'pro';screen:'play'|'live'}){
 const sample=face==='pro'?proSampleLesson:origamiSample;
 const steps=sample.steps as {id:string;title:string;instructions:string;target:string;criterion:string;visual:string}[]|undefined;
 const [state,setState]=useState<FState>('checking');
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const v=q.get('state');if(v==='right'||v==='wrong'||v==='canttell'||v==='check')setState(v==='check'?'checking':v as FState);},[]);
 const title=face==='pro'?proSampleLesson.lessonTitle:origamiSample.title;
 const category=face==='pro'?proSampleLesson.category:origamiSample.category;
 const chips:{right:string;wrong:string;canttell:string}={right:s["fixture.rightChip"],wrong:s["fixture.wrongChip"],canttell:s["fixture.cantTellChip"]};
 const ink=face==='pro'?'text-[#16161A]':'text-[#16161A]';
 const actionBtn='inline-flex min-h-11 items-center justify-center rounded-full bg-[#16A34A] px-6 py-3 font-semibold text-white disabled:opacity-50';
 const ghostBtn='inline-flex min-h-11 items-center justify-center rounded-full border border-site-border bg-white px-5 py-3 font-semibold text-site-ink';
 const step=steps&&steps[0]?steps[0]:null;
 const live=screen==='live';
 return (
  <div className={'mx-auto w-full '+(live?'max-w-[430px] px-4':'max-w-[720px] px-4 md:px-6 lg:max-w-[1120px] lg:px-8')+' '+ink}>
   <div className="pt-6 pb-24">
    <div className={banner} role="status"><strong>{s["fixture.banner"]}</strong> <span className="text-site-muted">{s["fixture.bannerSub"]}</span></div>
    <header className="mt-6 lg:mt-8 lg:flex lg:items-start lg:justify-between lg:gap-8">
     <div className="min-w-0">
      <p className="text-small font-semibold uppercase tracking-[0.14em] text-site-muted">{category} · fixture</p>
      <h1 className="mt-1 font-body-ui text-[1.75rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2rem]">{title}</h1>
      <p className="mt-2 max-w-[560px] text-body text-site-muted">{s["fixture.subtitle"]}</p>
     </div>
     <div className="mt-4 lg:mt-0"><VerdictChip variant={state==='right'?'right':state==='wrong'?'wrong':'canttell'} label={chips[state as 'right'|'wrong'|'canttell']||chips.right} size="large"/></div>
    </header>

    <section className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-8">
     <div className="min-w-0 rounded-[16px] border border-site-border bg-white p-4 lg:p-6">
      <p className="text-small uppercase tracking-wider text-site-muted">{s["fixture.stepTag"]} 1 · {step?.title}</p>
      <p className="mt-3 text-xl text-site-ink">{step?.instructions}</p>
      {step&&<div className={'mt-5 '+(state==='wrong'?'rounded-2xl ring-4 ring-danger/40 p-2':'')+(live?' rounded-2xl bg-[#101014] p-3':'')} aria-label="target visual">
       {/* eslint-disable-next-line @next/next/no-img-element */}
       <img className="max-h-80 w-full rounded-xl object-contain" src={step.visual} alt={`${s["fixture.stepTag"]} 1 — ${step.title}`} width={420} height={320}/>
      </div>}
      <p className="mt-4 text-small text-site-muted"><strong className="text-site-ink">{s["fixture.targetLabel"]}</strong> {step?.target}</p>
      <p className="mt-1 text-small text-site-muted"><strong className="text-site-ink">{s["fixture.criterionLabel"]}</strong> {step?.criterion}</p>
     </div>

     <div className="min-w-0">
      <div className="rounded-[16px] border border-site-border bg-white p-4 lg:p-6">
       {state==='checking'&&<>
        <div className="flex items-center gap-3"><span aria-hidden className="learning-spinner"/><h2 className="text-lg font-semibold text-site-ink">{s["fixture.checkingTitle"]}</h2></div>
        <p className="mt-2 text-small text-site-muted">{s["fixture.checkingBody"]}</p>
       </>}
       {state==='right'&&<>
        <h2 className="text-2xl font-bold text-site-ink">{s["fixture.rightTitle"]}</h2>
        <p className="mt-2 text-site-ink">{s["fixture.rightLine"]}</p>
        <VerdictChip variant="right" label={s["fixture.rightChip"]}/>
       </>}
       {state==='wrong'&&<>
        <h2 className="text-2xl font-bold text-site-ink">{s["fixture.wrongTitle"]}</h2>
        <p className="mt-2 text-site-ink">{s["fixture.wrongLine"]}</p>
        <VerdictChip variant="wrong" label={s["fixture.wrongChip"]}/>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" className={actionBtn}>{s["fixture.retake"]}</button><button type="button" className={ghostBtn}>{s["fixture.continue"]}</button></div>
       </>}
       {state==='canttell'&&<>
        <h2 className="text-2xl font-bold text-site-ink">{s["fixture.cantTellTitle"]}</h2>
        <p className="mt-2 text-site-ink">{s["fixture.cantTellLine"]}</p>
        <VerdictChip variant="canttell" label={s["fixture.cantTellChip"]}/>
        <div className="mt-5"><button type="button" className={actionBtn}>{s["fixture.acknowledge"]}</button></div>
       </>}
       <p className="mt-6 border-t border-site-border pt-4 text-small text-site-muted">{s["fixture.persistNote"]}</p>
      </div>
     </div>
    </section>
   </div>
  </div>
 );
}