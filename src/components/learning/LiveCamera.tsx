"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {type Assessment,type Lesson,type Progress,type Step} from '@/lib/learning';
import {useIdentity} from './Identity';

const button='inline-flex min-h-11 items-center justify-center rounded-full border border-site-border-2 bg-white px-4 py-3 text-center text-small font-semibold text-site-ink disabled:opacity-50';
type Props={lesson:Lesson;step:Step;progress:Progress;token:string|null;disabled:boolean;stopRef:{current:()=>void};initialLive:boolean;onFeedback:(value:Assessment)=>void;onError:(value:string|null)=>void};

/** Preview and self-comparison stay local. AI receives one frame only after explicit opt-in and a check click. */
export function LiveCamera({lesson,step,progress,token,disabled,stopRef,initialLive,onFeedback,onError}:Props){
 const identity=useIdentity();
 const [shown,setShown]=useState(initialLive),[state,setState]=useState<'stopped'|'opening'|'preview'>('stopped'),[devices,setDevices]=useState<MediaDeviceInfo[]>([]),[snapshot,setSnapshot]=useState<string|null>(null),[checks,setChecks]=useState<string[]>([]),[consent,setConsent]=useState(false),[checking,setChecking]=useState(false),[message,setMessage]=useState<string|null>(null),[online,setOnline]=useState(true);
 const video=useRef<HTMLVideoElement|null>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0),opening=useRef(false),mounted=useRef(true),selected=useRef(''),facing=useRef<'user'|'environment'>('environment'),request=useRef<AbortController|null>(null),inFlight=useRef(false);
 const stop=useCallback(()=>{
  generation.current++;opening.current=false;request.current?.abort();request.current=null;inFlight.current=false;
  const previous=stream.current;stream.current=null;previous?.getTracks().forEach(track=>track.stop());
  if(video.current)video.current.srcObject=null;
  if(mounted.current){setState('stopped');setChecking(false);setSnapshot(null);setConsent(false);}
 },[]);
 useEffect(()=>{
  mounted.current=true;stopRef.current=stop;
  const hidden=()=>{if(document.hidden)stop();},connection=()=>{setOnline(navigator.onLine);if(!navigator.onLine){request.current?.abort();setChecking(false);setMessage('You’re offline. Local preview and self-comparison still work.');}};
  setOnline(navigator.onLine);document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);window.addEventListener('offline',connection);window.addEventListener('online',connection);
  return()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);window.removeEventListener('offline',connection);window.removeEventListener('online',connection);if(stopRef.current===stop)stopRef.current=()=>{};};
 },[stop,stopRef]);
 useEffect(()=>{if(disabled)stop();},[disabled,stop]);
 async function open(id?:string){
  if(disabled||opening.current||stream.current)return;
  if(!navigator.mediaDevices?.getUserMedia){setMessage('This browser cannot open a camera here. Open the site directly over HTTPS, or use a photo or self-review.');return;}
  opening.current=true;setState('opening');setMessage(null);const epoch=++generation.current;
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{...(id?{deviceId:{exact:id}}:{facingMode:{ideal:facing.current}}),width:{ideal:1280},height:{ideal:720}}});
   if(!mounted.current||epoch!==generation.current){media.getTracks().forEach(track=>track.stop());return;}
   stream.current=media;const track=media.getVideoTracks()[0],settings=track?.getSettings();selected.current=settings?.deviceId||id||'';
   if(settings?.facingMode==='user'||settings?.facingMode==='environment')facing.current=settings.facingMode;
   track?.addEventListener('ended',()=>{if(stream.current===media){stop();setMessage('Camera disconnected. Reconnect it and open the camera again, or continue with self-review.');}},{once:true});
   if(video.current){video.current.srcObject=media;try{await video.current.play();}catch{/* Native controls allow a manual play on restrictive browsers. */}}
   if(!mounted.current||epoch!==generation.current)return;setState('preview');
   try{const list=await navigator.mediaDevices.enumerateDevices();if(mounted.current&&epoch===generation.current)setDevices(list.filter(device=>device.kind==='videoinput'&&device.deviceId));}catch{/* Facing-mode switching remains available without device enumeration. */}
  }catch(error){if(mounted.current&&epoch===generation.current){setState('stopped');const name=(error as {name?:string}|null)?.name||'';setMessage(name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser’s site settings, then try again. Photo upload and self-review are still available.':name==='NotFoundError'?'No camera was found. Connect a camera, or use a photo or self-review.':name==='NotReadableError'?'The camera is busy. Close other apps using it and try again.':'Could not open that camera. Try again, use a photo, or self-review.');}}
  finally{if(mounted.current&&epoch===generation.current)opening.current=false;}
 }
 async function switchCamera(){
  if(disabled||opening.current||!stream.current)return;
  const next=devices.length>1?devices[(devices.findIndex(device=>device.deviceId===selected.current)+1)%devices.length]:null;
  facing.current=facing.current==='environment'?'user':'environment';stop();await open(next?.deviceId);
 }
 function capture(){
  const element=video.current;
  if(!stream.current||!element?.videoWidth||!element.videoHeight){setMessage('Wait until the camera picture appears, then try again.');return null;}
  try{const canvas=document.createElement('canvas'),ratio=Math.min(1,960/element.videoWidth);canvas.width=Math.max(1,Math.round(element.videoWidth*ratio));canvas.height=Math.max(1,Math.round(element.videoHeight*ratio));const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');context.drawImage(element,0,0,canvas.width,canvas.height);const image=canvas.toDataURL('image/jpeg',.8);setSnapshot(image);setMessage(null);return image;}catch{setMessage('Could not capture a still. You can continue with the live preview or upload a photo.');return null;}
 }
 const paidAvailable=!!identity.config?.ai_available&&!!identity.config.budget&&!identity.config.budget.paused&&identity.config.budget.remaining_usd>0;
 async function checkFrame(){
  if(!consent||!paidAvailable||disabled||inFlight.current||!online)return;
  const image=capture();if(!image)return;const epoch=generation.current,controller=new AbortController();request.current=controller;inFlight.current=true;setChecking(true);onError(null);
  try{const value=await identity.request<Assessment>('/api/assess',{session_id:progress.session_id,lesson_id:lesson.id,step_id:step.id,submission_id:'frame_'+crypto.randomUUID(),mime_type:'image/jpeg',image_base64:image.split(',')[1]},{token,signal:controller.signal});if(mounted.current&&epoch===generation.current&&!controller.signal.aborted)onFeedback(value);}
  catch(error){if(mounted.current&&epoch===generation.current&&!controller.signal.aborted)onError(error instanceof Error?error.message:'Camera check failed. Continue with free self-review.');}
  finally{if(request.current===controller){request.current=null;inFlight.current=false;if(mounted.current)setChecking(false);}}
 }
 const criteria=step.assessment_criteria?.length?step.assessment_criteria:[step.expected_visual_result||step.instructions];
 return <section className="mt-6 border-t border-site-border pt-5" aria-label="Live camera practice">
  <button type="button" className="text-small font-semibold underline" aria-expanded={shown} disabled={disabled} onClick={()=>{if(shown)stop();setShown(value=>!value);}}>{shown?'Hide live camera':'Practice with live camera · free'}</button>
  {shown&&<div className="mt-4 space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-semibold">See it. Try it. Compare.</h3><span className="rounded-full bg-accent/15 px-3 py-1 text-small">Free local preview</span></div>
   <p className="text-small text-site-muted">Keep your work in view while you follow this step. Preview, stills and the checklist stay on this device. No microphone or recording.</p>
   <div className="relative overflow-hidden rounded-2xl bg-[#16161a]">
    <video ref={video} autoPlay playsInline muted controls={state==='preview'} className="aspect-video w-full object-contain" aria-label="Your local camera preview"/>
    {state==='stopped'&&<div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-small text-white/70">Open your camera when you’re ready</div>}
   </div>
   <p role="status" className="text-small">{checking?'Checking one frame with AI…':state==='opening'?'Waiting for camera permission…':state==='preview'?'Camera on · local preview only':'Camera stopped'}</p>
   {message&&<p role="alert" className="rounded-xl bg-site-page p-3 text-small">{message}</p>}
   <div className="grid grid-cols-2 gap-2">
    <button type="button" className={button} disabled={state!=='stopped'||disabled} onClick={()=>void open()}>Open camera</button>
    <button type="button" className={button} disabled={state!=='preview'||disabled||checking} onClick={()=>void switchCamera()}>Switch camera</button>
    <button type="button" className={button} disabled={state!=='preview'||disabled||checking} onClick={capture}>Capture still · free</button>
    <button type="button" className={button} disabled={state==='stopped'&&!checking&&!snapshot} onClick={stop}>Stop camera</button>
   </div>
   {snapshot&&<figure><img src={snapshot} alt="Your local comparison still" className="max-h-80 w-full rounded-2xl bg-site-page object-contain"/><figcaption className="mt-2 text-small text-site-muted">Local still · cleared when you stop or leave this step</figcaption><button type="button" className="mt-2 text-small underline" disabled={checking} onClick={()=>setSnapshot(null)}>Discard still</button></figure>}
   <fieldset className="space-y-3 rounded-2xl border border-site-border p-4"><legend className="px-1 text-small font-semibold">Compare with your target</legend><p className="text-small text-site-muted">{step.expected_visual_result}</p>{criteria.map((criterion,index)=><label key={index} className="flex items-start gap-3 text-small"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-amber-500" checked={checks.includes(String(index))} onChange={event=>setChecks(previous=>event.target.checked?[...previous,String(index)]:previous.filter(value=>value!==String(index)))}/><span>{criterion}</span></label>)}<p className="text-small text-site-muted">These are your own observations. Use the self-review button below to save practice progress.</p></fieldset>
   {step.photo_assessable!==false&&<details className="rounded-2xl border border-site-border p-4"><summary className="cursor-pointer text-small">Optional AI check · uses existing allowance</summary><p className="my-3 text-small text-site-muted">A check sends one frame to Meta. Frames are not saved; feedback is saved privately. It does not advance the step. There is no automatic stream or repeat check. Stop cancels waiting; a check already sent may still use allowance.</p><label className="flex items-start gap-3 text-small"><input type="checkbox" checked={consent} disabled={checking} onChange={event=>setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0"/><span>Allow one-frame AI checks using the shared allowance</span></label><button type="button" className={button+' mt-3 w-full'} disabled={!consent||!paidAvailable||!online||state!=='preview'||checking||disabled} onClick={()=>void checkFrame()}>{checking?'Checking…':'Check one frame · uses AI allowance'}</button>{!paidAvailable&&<p className="mt-2 text-small text-site-muted">AI checks are unavailable. Free camera practice still works.</p>}</details>}
  </div>}
 </section>;
}
