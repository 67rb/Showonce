'use strict';
(function(){
 const KEY='showonce-library-v1',LEGACY_KEY='showonce-practice-v2';
 const unreadable='Some saved practice entries could not be read. Their original access data was kept.';
 const unavailable='Practice access could not be read from this browser. Existing saved access has not been replaced.';
 const unsaved='This browser could not save practice access. You can continue in this tab, but the new resume access may be lost when it closes.';
 const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(value);
 const credential=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,512}$/.test(value);
 const text=(value,max)=>typeof value==='string'&&value.trim()&&value.trim().length<=max?value.trim():null;
 const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
 function normalize(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!identifier(value.id)||!credential(value.token)||!identifier(value.lesson_id))return null;
  const title=text(value.title,400),category=text(value.category,100),updated_at=date(value.updated_at),created_at=date(value.created_at);
  if(!title||!category||!updated_at||!created_at||!Number.isSafeInteger(value.total_steps)||value.total_steps<1||value.total_steps>100||!Number.isSafeInteger(value.completed_steps)||value.completed_steps<0||value.completed_steps>value.total_steps)return null;
  const status=value.completed_steps===value.total_steps?'completed':'active';
  if(value.status!==status)return null;
  // Copy only compact display metadata and the private session capability. Never
  // retain tutorial text, lesson steps, learner photos or arbitrary extra data.
  return {id:value.id,token:value.token,lesson_id:value.lesson_id,title,category,total_steps:value.total_steps,completed_steps:value.completed_steps,status,updated_at,created_at};
 }
 const sorted=entries=>entries.slice().sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)||Date.parse(b.created_at)-Date.parse(a.created_at)||a.id.localeCompare(b.id));
 function load(storage){
  let raw;
  try{raw=storage.getItem(KEY);}catch{return {entries:[],opaque:[],blocked:true,error:unavailable};}
  if(raw===null||raw===undefined)return {entries:[],opaque:[],blocked:false,error:null};
  let data;try{data=JSON.parse(raw);}catch{return {entries:[],opaque:[],blocked:true,error:unavailable};}
  if(!data||data.version!==1||!Array.isArray(data.entries))return {entries:[],opaque:[],blocked:true,error:unavailable};
  const records=new Map(),opaque=[];
  for(const item of data.entries){
   const entry=normalize(item);
   if(!entry){opaque.push(item);continue;}
   const existing=records.get(entry.id);
   if(!existing){records.set(entry.id,entry);continue;}
   // A different capability for the same ID cannot be verified locally. Keep its
   // original bytes rather than silently overwriting potentially useful access.
   if(existing.token!==entry.token){opaque.push(item);continue;}
   const latest=Date.parse(entry.updated_at)>Date.parse(existing.updated_at)?entry:existing;
   records.set(entry.id,{...latest,created_at:Date.parse(entry.created_at)<Date.parse(existing.created_at)?entry.created_at:existing.created_at});
  }
  return {entries:sorted([...records.values()]),opaque,blocked:false,error:opaque.length?unreadable:null};
 }
 function read(storage){const result=load(storage);return {entries:result.entries,error:result.error,persisted:!result.blocked};}
 function remember(storage,value,fallbackEntries=[]){
  // Re-read on every write so a stale tab's in-memory list does not overwrite
  // entries saved by another tab since its last render. Web Storage itself does
  // not provide an atomic transaction across simultaneously writing windows.
  const current=load(storage),entry=normalize(value),known=new Map(current.entries.map(item=>[item.id,item]));
  // Failed writes can leave valid access only in this tab's memory. Retain those
  // entries on later attempts, while a fresh stored record always wins over a
  // stale fallback copy of the same session.
  if(Array.isArray(fallbackEntries))for(const item of fallbackEntries){const fallback=normalize(item);if(fallback&&!known.has(fallback.id))known.set(fallback.id,fallback);}
  const base=sorted([...known.values()]);
  if(!entry)return {entries:base,error:'This practice record is incomplete. Existing saved access was kept.',persisted:false};
  const existing=base.find(item=>item.id===entry.id);
  if(existing&&existing.token!==entry.token)return {entries:base,error:'This practice already has different saved access. Its existing access was kept.',persisted:false};
  const latest=existing&&Date.parse(existing.updated_at)>Date.parse(entry.updated_at)?existing:entry;
  const record=existing?{...latest,created_at:existing.created_at}:entry;
  const entries=sorted([...base.filter(item=>item.id!==entry.id),record]);
  if(current.blocked)return {entries,error:current.error,persisted:false};
  try{storage.setItem(KEY,JSON.stringify({version:1,entries:[...entries,...current.opaque]}));}
  catch{return {entries,error:unsaved,persisted:false};}
  return {entries,error:current.error,persisted:true};
 }
 function migrate(storage,legacy){
  const current=read(storage);
  if(legacy===undefined){
   try{const value=storage.getItem(LEGACY_KEY);legacy=value?JSON.parse(value):null;}
   catch{return {...current,error:'The older saved practice could not be read. Existing library access was kept.'};}
  }
  if(!legacy?.session||!identifier(legacy.session.id)||!credential(legacy.session.token))return current;
  if(current.entries.some(entry=>entry.id===legacy.session.id))return current;
  const lesson=legacy.lesson,steps=lesson?.steps;
  if(!lesson||!identifier(lesson.id)||!Array.isArray(steps)||steps.length<1||steps.length>100||steps.some(step=>!identifier(step?.id)))return {...current,error:'The older saved practice was incomplete. Its original access data was kept.'};
  const completed=steps.reduce((count,step,index)=>count+(legacy.done?.[index]?.step_id===step.id&&['self','photo'].includes(legacy.done[index].kind)?1:0),0),now=new Date().toISOString();
  // AI lesson text can exceed compact card limits. Shorten only copied display
  // metadata; the original legacy record and server-owned lesson stay intact.
  const title=typeof lesson.title==='string'?lesson.title.trim().slice(0,400):lesson.title;
  const originalCategory=lesson.category||'practice',category=typeof originalCategory==='string'?originalCategory.trim().slice(0,100):originalCategory;
  // Unknown-age legacy progress must never outrank a later server snapshot.
  // created_at records when access was first imported; updated_at stays older
  // than real server timestamps until that session is refreshed.
  return remember(storage,{id:legacy.session.id,token:legacy.session.token,lesson_id:lesson.id,title,category,total_steps:steps.length,completed_steps:completed,status:completed===steps.length?'completed':'active',updated_at:date(legacy.updated_at)||'1970-01-01T00:00:00.000Z',created_at:date(legacy.created_at)||date(legacy.updated_at)||now});
 }
 window.ShowOnceLibrary={KEY,LEGACY_KEY,read,remember,migrate};
})();
