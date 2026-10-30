/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
export type Step = {id:string;position:number;title?:string;instructions:string;expected_visual_result:string;assessment_criteria:string[];visual_limits:string[];photo_assessable?:boolean;source_reference?:{url?:string;quote?:string};coaching_origin?:string};
export type Lesson = {id:string;title:string;category:string;materials:string[];difficulty?:string;steps:Step[];source_url?:string;source_attribution?:string;safety_notice?:string;practice_restrictions?:string[];content_origin?:string};
export type Progress = {session_id:string;lesson_id:string;access_token?:string;account_owned?:boolean;status:string;current_step_id:string|null;completed_step_ids:string[];completed_checkpoints:{step_id:string;kind:string;observations?:string[]}[];total_steps:number;updated_at:string};
export type Assessment = {result:'pass'|'retry'|'uncertain';feedback:string;corrections:string[];requested_evidence:string[];criteria:{criterion:string;status:string;evidence:string}[];feedback_id?:string;provider?:string;model?:string};
export type Submission = {id:string;step_id:string;status:string;created_at:string;assessment:Assessment|null;image_available:boolean};
export type Account = {authenticated:boolean;user:{id:string;email:string;display_name:string}|null;is_admin:boolean};
export type Entry = {id:string;lesson_id:string;token?:string|null;title:string;category:string;total_steps:number;completed_steps:number;status:string;created_at:string;updated_at:string;account_owned?:boolean};
export type Config = {examples:{id:string;title:string;category:string;steps:number}[];ai_available:boolean;source_processing?:{enabled:boolean};budget?:{remaining_usd:number;paused:boolean;limit_usd?:number}};
export class LearningError extends Error {code:string;status?:number;constructor(message:string,code='request_interrupted',status?:number){super(message);this.code=code;this.status=status;}}
export function lessonHref(lesson:string,session?:string,screen='overview'){const params=new URLSearchParams({lesson_id:lesson});if(session)params.set('session_id',session);return (typeof window!=='undefined'&&window.location.pathname.startsWith('/professional')?'/professional/lesson/runtime/':'/lesson/runtime/')+(screen==='overview'?'':screen+'/')+'?'+params;}
export function currentQuery(){return new URLSearchParams(typeof window==='undefined'?'':window.location.search);}
export function entryFrom(lesson:Lesson,progress:Progress,token?:string|null):Entry{return {id:progress.session_id,lesson_id:lesson.id,token,title:lesson.title,category:lesson.category,total_steps:lesson.steps.length,completed_steps:progress.completed_step_ids.length,status:progress.status,account_owned:progress.account_owned,updated_at:progress.updated_at,created_at:new Date().toISOString()};}
export function photoData(file:File):Promise<{mime_type:string;image_base64:string}>{return new Promise((resolve,reject)=>{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5242880){reject(new LearningError('Choose a PNG, JPEG or WebP image up to 5 MiB.','invalid_image'));return;}const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read that image.'));reader.onload=()=>resolve({mime_type:file.type,image_base64:String(reader.result).split(',')[1]});reader.readAsDataURL(file);});}
type LegacyResult={entries:Entry[];error?:string|null;persisted?:boolean};
declare global {interface Window {ShowOnceLibrary?:{migrate:(storage:Storage)=>LegacyResult;remember:(storage:Storage,entry:Entry,fallback:Entry[])=>LegacyResult};}}
export function browserEntries():LegacyResult{try{return window.ShowOnceLibrary?.migrate(window.localStorage)||{entries:[],error:'Browser access is still loading. Refresh to retry.'};}catch{return {entries:[],error:'Browser storage is unavailable. Keep this tab open to retain new practice access.'};}}
export function rememberBrowser(entry:Entry,fallback:Entry[]):LegacyResult{try{return window.ShowOnceLibrary?.remember(window.localStorage,entry,fallback)||{entries:[entry,...fallback],error:'Keep this tab open; browser access could not be saved.'};}catch{return {entries:[entry,...fallback],error:'Keep this tab open; browser access could not be saved.'};}}

/** A configured provider can still have no remaining shared allowance. */
export function aiChecksAvailable(config:Config|null){return !!config?.ai_available&&!!config.budget&&!config.budget.paused&&config.budget.remaining_usd>0;}
export function abortableDelay(ms:number,signal:AbortSignal):Promise<void>{return new Promise((resolve,reject)=>{
 const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new LearningError('Stopped waiting. A request already sent may still use the allowance.','request_aborted'));};
 const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
 if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
});}

export function workspaceHref(screen:'library'|'create'){const professional=typeof window!=='undefined'&&window.location.pathname.startsWith('/professional');return professional?(screen==='library'?'/professional/lessons/':'/professional/create/'):(screen==='library'?'/lessons/':'/create/');}
