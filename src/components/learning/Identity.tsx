/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import s from '@/lib/strings';
import {LearningError,accountActionHref,browserEntries,rememberBrowser,entryFrom,type Account,type Config,type Entry,type Lesson,type Progress} from '@/lib/learning';
type Options={method?:string;token?:string|null;key?:string;signal?:AbortSignal;image?:boolean};
type SourceDraft={mode:string;url:string;text:string;reference:string;stepsText:string;stepsReference:string;linkTranscript:string;linkTranscriptURL:string;goal:string;learningMode:string};
const initialDraft=():SourceDraft=>({mode:'link',url:'',text:'',reference:'',stepsText:'',stepsReference:'',linkTranscript:'',linkTranscriptURL:'',goal:'',learningMode:'visual'});
// 5.2 — the account check has an 8-second timeout. It never spins forever:
// on timeout the page renders the signed-out version plus one inline notice
// with a Retry button.
const ACCOUNT_CHECK_TIMEOUT_MS=8000;
type Identity={practice:{current:number;total:number}|null;ready:boolean;timedOut:boolean;account:Account|null;config:Config|null;error:string|null;notice:string|null;epoch:()=>number;request:<T>(path:string,body?:unknown,options?:Options)=>Promise<T>;refresh:()=>Promise<void>;guestEntries:()=>Entry[];remember:(lesson:Lesson,progress:Progress,token?:string|null)=>void;draft:SourceDraft;setDraft:(value:SourceDraft)=>void};
const Context=createContext<Identity|null>(null);
export function IdentityProvider({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[timedOut,setTimedOut]=useState(false),[account,setAccount]=useState<Account|null>(null),[config,setConfig]=useState<Config|null>(null),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null),[draft,setDraft]=useState(initialDraft);
 const [practice,setPractice]=useState<{current:number;total:number}|null>(null);
 const actor=useRef<string|null>(null),version=useRef(0),resolved=useRef(false),available=useRef(false),guests=useRef<Entry[]>([]),refreshID=useRef(0),timeoutID=useRef<ReturnType<typeof setTimeout>|null>(null);
 const request=useCallback(async<T,>(path:string,body?:unknown,options:Options={}):Promise<T>=>{
  const epoch=version.current,subject=actor.current;
  if(path!=='/api/account'&&path!=='/api/config'&&!available.current)throw new LearningError('Check your account connection before continuing.','account_unchecked');
  const controller=new AbortController(),abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();const timeout=setTimeout(abort,body===undefined?20000:300000);
  try{const headers:Record<string,string>={};if(body!==undefined)headers['Content-Type']='application/json';if(subject&&path!=='/api/account'&&path!=='/api/config')headers['X-ShowOnce-Account']=subject;if(options.token)headers.Authorization='Bearer '+options.token;if(options.key)headers['Idempotency-Key']=options.key;
   let response;try{response=await fetch(path,{method:options.method||(body===undefined?'GET':'POST'),headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,credentials:'same-origin',cache:'no-store'});}catch{throw new LearningError('Connection interrupted. Refresh saved progress or history before retrying a check.');}
   if(epoch!==version.current&&path!=='/api/account')throw new LearningError('Your account changed. Open your practice again.','account_changed');
   if(response.status===204)return null as T;
   if(options.image&&response.ok)return await response.blob() as T;
   let value;try{value=await response.json();}catch{throw new LearningError('The service returned an unreadable response. Refresh saved progress before retrying.');}
   if(!response.ok){if(value.error?.code==='account_changed'){available.current=false;setReady(false);window.dispatchEvent(new Event('showonce-account-changed'));}throw new LearningError(value.error?.message||'The action could not be completed.',value.error?.code||'service_unavailable',response.status);}
   return value as T;
  }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort);}
 },[]);
 const refresh=useCallback(async()=>{
  const id=++refreshID.current;available.current=false;setReady(false);setTimedOut(false);setError(null);
  if(timeoutID.current)clearTimeout(timeoutID.current);
  timeoutID.current=setTimeout(()=>{if(id===refreshID.current){available.current=false;setReady(true);setTimedOut(true);}},ACCOUNT_CHECK_TIMEOUT_MS);
  try{const [response,settings]=await Promise.all([request<Account>('/api/account'),request<Config>('/api/config')]);if(id!==refreshID.current)return;const next=response.user?.id||null;
   if(resolved.current&&next!==actor.current){version.current++;setPractice(null);setDraft(initialDraft());guests.current=[];setNotice(null);try{window.localStorage.removeItem('showonce-last-camera-v1');window.localStorage.removeItem('showonce-camera-res-v1');}catch{}}actor.current=next;resolved.current=true;setAccount(response);available.current=true;
   try{window.localStorage.setItem('showonce-active-account-v1',next||'anonymous');}catch{}
   if(id!==refreshID.current)return;setConfig(settings);setReady(true);setTimedOut(false);if(timeoutID.current)clearTimeout(timeoutID.current);
  }catch(e){if(id===refreshID.current){available.current=false;setReady(false);setError(e instanceof Error?e.message:'Account check failed.');/* 5.2 — the timeout is NOT cleared on failure: the 8s timer still renders the signed-out page with the retry notice, so the check can never spin forever. */}}
 },[request]);
 useEffect(()=>{void refresh();const changed=()=>{version.current++;available.current=false;setReady(false);void refresh();};const storage=(event:StorageEvent)=>{if(event.key==='showonce-active-account-v1'&&event.newValue!==(actor.current||'anonymous'))changed();};window.addEventListener('showonce-account-changed',changed);window.addEventListener('storage',storage);return()=>{refreshID.current++;if(timeoutID.current)clearTimeout(timeoutID.current);window.removeEventListener('showonce-account-changed',changed);window.removeEventListener('storage',storage);};},[refresh]);
 const guestEntries=useCallback(()=>{const saved=browserEntries();if(saved.error)setNotice(saved.error);guests.current=[...new Map([...saved.entries,...guests.current].map(entry=>[entry.id,entry])).values()];return guests.current;},[]);
 const remember=useCallback((lesson:Lesson,progress:Progress,token?:string|null)=>{const total=progress.total_steps,current=Math.min(total,progress.completed_step_ids.length+1);setPractice(previous=>previous?.total===total&&previous?.current===current?previous:{current,total});if(progress.account_owned||actor.current)return;const saved=rememberBrowser(entryFrom(lesson,progress,token),guests.current);guests.current=saved.entries;if(saved.error)setNotice(saved.error);},[]);
 return <Context.Provider value={{practice,ready,timedOut,account,config,error,notice,epoch:()=>version.current,request,refresh,guestEntries,remember,draft,setDraft}}>{children}</Context.Provider>;
}
export function useIdentity(){const value=useContext(Context);if(!value)throw new Error('Learning identity provider is missing.');return value;}
export function AccountBar(){
 const identity=useIdentity();
 if(identity.timedOut){
   return <div className="rounded-2xl border border-site-border bg-white p-5 text-small"><p className="font-semibold text-site-ink">{s["signInUnavailableTitle"]}</p><p className="mt-1 text-site-muted">{s["accountCheckTimedOut"]}</p><p role="status" className="mt-2 text-site-muted">{s["signInWorkspaceLine"]}</p><button onClick={()=>void identity.refresh()} className="mt-3 min-h-11 rounded-full border border-site-border bg-white px-4 font-semibold text-site-ink">{s["retry"]}</button></div>;
 }
 if(!identity.ready){
  return <div className="space-y-3 rounded-2xl border border-site-border bg-white p-5" role="status" aria-label={s["checkingAccount"]}><p className="h-3 w-1/3 rounded bg-site-border"/><div className="h-4 w-full rounded bg-site-border"/><div className="h-4 w-2/3 rounded bg-site-border"/></div>;
 }
 return <div className="site-card flex flex-wrap items-center justify-between gap-3 p-5"><div><strong>{identity.account?.user?.display_name||'Your practice workspace'}</strong><p className="text-small text-site-muted">{identity.account?.user?'Saved across devices with your account.':s["signInWorkspaceLine"]}</p></div><div className="flex flex-wrap gap-3 text-small">{identity.account?.is_admin&&<a href="/team.html" className="underline">Manage catalogue & reports</a>}{identity.account?.user&&identity.account.sign_out_url&&<a className="min-h-11 py-3 underline" href={accountActionHref(identity.account.sign_out_url)}>Sign out</a>}{!identity.account?.user&&(identity.account?.sign_in_url?<a className="min-h-11 py-3 font-semibold underline" href={accountActionHref(identity.account.sign_in_url)}>{identity.account.identity_provider==='github'?'Sign in with GitHub':'Sign in'}</a>:<p className="text-site-muted">{s["signInUnavailableBody"]}</p>)}</div>{identity.notice&&<p className="w-full text-small" role="status">{identity.notice}</p>}</div>;
}
