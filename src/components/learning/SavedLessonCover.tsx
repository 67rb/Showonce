/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {useEffect,useState} from 'react';
import {type Entry,type Lesson} from '@/lib/learning';
import {useIdentity} from './Identity';

/** Uses existing approved artwork only; library thumbnails never buy images. */
export function SavedLessonCover({entry,lesson:provided,token,large=false}:{entry?:Entry;lesson?:Lesson;token?:string|null;large?:boolean}){
 const identity=useIdentity(),[image,setImage]=useState<string|null>(null),[alt,setAlt]=useState('');
 const id=provided?.id||entry?.lesson_id,access=token||entry?.token;
 useEffect(()=>{
  const controller=new AbortController();let objectURL:string|null=null;setImage(null);
  void(async()=>{try{
   const lesson=provided||await identity.request<Lesson>('/v1/lessons/'+encodeURIComponent(id!),undefined,{token:access,signal:controller.signal});
   const step=lesson.steps[Math.min(entry?.completed_steps||0,lesson.steps.length-1)];if(!step)return;
   const blob=await identity.request<Blob>('/v1/lessons/'+encodeURIComponent(lesson.id)+'/steps/'+encodeURIComponent(step.id)+'/illustration/image',undefined,{token:access,image:true,signal:controller.signal});
   if(controller.signal.aborted)return;objectURL=URL.createObjectURL(blob);setAlt('AI illustration preview: '+step.expected_visual_result);setImage(objectURL);
  }catch{/* The source lesson and its written checkpoints remain available. */}})();
  return()=>{controller.abort();if(objectURL)URL.revokeObjectURL(objectURL);};
 },[id,provided,entry?.completed_steps,access,identity.request]);
 return <div className={large?'relative aspect-[4/3] w-full overflow-hidden rounded-[16px] border border-site-border bg-site-page':'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-site-border bg-site-page'}>
  {image?<img src={image} alt={alt} className="h-full w-full object-contain"/>:<div aria-hidden="true" className="flex h-full items-center justify-center bg-site-page text-accent-deep"><svg width={large?72:34} height={large?72:34} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 10c7-2 12-1 17 3 5-4 10-5 17-3v28c-7-2-12-1-17 3-5-4-10-5-17-3V10Z"/><path d="M24 13v28M12 17l7 2M12 24l7 2M29 19l7-2M29 26l7-2"/></svg></div>}
 </div>;
}
