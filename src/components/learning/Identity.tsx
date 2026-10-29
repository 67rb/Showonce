"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {LearningError,browserEntries,rememberBrowser,entryFrom,type Account,type Config,type Entry,type Lesson,type Progress} from '@/lib/learning';
type Options={method?:string;token?:string|null;key?:string;signal?:AbortSignal;image?:boolean};
type SourceDraft={mode:string;url:string;text:string;reference:string;stepsText:string;stepsReference:string;linkTranscript:string;linkTranscriptURL:string;goal:string;learningMode:string};
const initialDraft=():SourceDraft=>({mode:'link',url:'',text:'',reference:'',stepsText:'',stepsReference:'',linkTranscript:'',linkTranscriptURL:'',goal:'',learningMode:'visual'});
type Identity={practice:{current:number;total:number}|null;ready:boolean;account:Account|null;config:Config|null;error:string|null;notice:string|null;epoch:()=>number;request:<T>(path:string,body?:unknown,options?:Options)=>Promise<T>;refresh:()=>Promise<void>;guestEntries:()=>Entry[];remember:(lesson:Lesson,progress:Progress,token?:string|null)=>void;draft:SourceDraft;setDraft:(value:SourceDraft)=>void};
const Context=createContext<Identity|null>(null);
export function IdentityProvider({children}:{children:ReactNode}){
 const [ready,setReady]=useState(false),[account,setAccount]=useState<Account|null>(null),[config,setConfig]=useState<Config|null>(null),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null),[draft,setDraft]=useState(initialDraft);
 const [practice,setPractice]=useState<{current:number;total:number}|null>(null);
 const actor=useRef<string|null>(null),version=useRef(0),resolved=useRef(false),available=useRef(false),guests=useRef<Entry[]>([]),refreshID=useRef(0);
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
  const id=++refreshID.current;available.current=false;setReady(false);setError(null);
  try{const [response,settings]=await Promise.all([request<Account>('/api/account'),request<Config>('/api/config')]);if(id!==refreshID.current)return;const next=response.user?.id||null;
   if(resolved.current&&next!==actor.current){version.current++;setPractice(null);setDraft(initialDraft());guests.current=[];setNotice(null);}actor.current=next;resolved.current=true;setAccount(response);available.current=true;
   try{window.localStorage.setItem('showonce-active-account-v1',next||'anonymous');}catch{}
   if(id!==refreshID.current)return;setConfig(settings);setReady(true);
  }catch(e){if(id===refreshID.current){available.current=false;setReady(false);setError(e instanceof Error?e.message:'Account check failed.');}}
 },[request]);
 useEffect(()=>{void refresh();const hide=()=>{version.current++;available.current=false;setReady(false);},visible=()=>{if(document.hidden)hide();else void refresh();},changed=()=>{hide();void refresh();},storage=(event:StorageEvent)=>{if(event.key==='showonce-active-account-v1'&&event.newValue!==(actor.current||'anonymous'))changed();};document.addEventListener('visibilitychange',visible);window.addEventListener('pagehide',hide);window.addEventListener('showonce-account-changed',changed);window.addEventListener('storage',storage);return()=>{document.removeEventListener('visibilitychange',visible);window.removeEventListener('pagehide',hide);window.removeEventListener('showonce-account-changed',changed);window.removeEventListener('storage',storage);};},[refresh]);
 const guestEntries=useCallback(()=>{const saved=browserEntries();if(saved.error)setNotice(saved.error);guests.current=[...new Map([...saved.entries,...guests.current].map(entry=>[entry.id,entry])).values()];return guests.current;},[]);
 const remember=useCallback((lesson:Lesson,progress:Progress,token?:string|null)=>{const total=progress.total_steps,current=Math.min(total,progress.completed_step_ids.length+1);setPractice(previous=>previous?.total===total&&previous?.current===current?previous:{current,total});if(progress.account_owned||actor.current)return;const saved=rememberBrowser(entryFrom(lesson,progress,token),guests.current);guests.current=saved.entries;if(saved.error)setNotice(saved.error);},[]);
 return <Context.Provider value={{practice,ready,account,config,error,notice,epoch:()=>version.current,request,refresh,guestEntries,remember,draft,setDraft}}>{children}</Context.Provider>;
}
export function useIdentity(){const value=useContext(Context);if(!value)throw new Error('Learning identity provider is missing.');return value;}
export function AccountBar(){const identity=useIdentity();if(!identity.ready)return <div className="site-card p-5" role={identity.error?'alert':'status'}>{identity.error||'Checking your account…'}{identity.error&&<button onClick={()=>void identity.refresh()} className="ml-3 underline">Retry</button>}</div>;return <div className="site-card flex flex-wrap items-center justify-between gap-3 p-5"><div><strong>{identity.account?.user?.display_name||'Your practice workspace'}</strong><p className="text-small text-site-muted">{identity.account?.user?'Saved across devices with your account.':'Sign in to keep your library across devices. Browser practices remain separate.'}</p></div><div className="flex flex-wrap gap-3 text-small">{identity.account?.is_admin&&<a href="/team.html" className="underline">Manage catalogue & reports</a>}{identity.account?.user?<a href="/signout-with-chatgpt?return_to=%2Flessons%2F" target="_top" className="underline">Sign out</a>:<><a href="/signin-with-chatgpt?return_to=%2Flessons%2F" target="_top" className="font-semibold underline">Sign in / sign up</a><a href="/signin-with-chatgpt?return_to=%2Flessons%2F" target="_top" className="underline">Recover account access</a></>}</div>{identity.notice&&<p className="w-full text-small" role="status">{identity.notice}</p>}</div>;}
