"use client";
import {useCallback,useEffect,useReducer,useRef,useState} from 'react';
import {aiChecksAvailable,photoData,type Assessment,type Lesson,type Progress,type Step} from '@/lib/learning';
import {qualityFromCanvas,type FrameQuality} from '@/lib/camera-quality';
import {illustrationKey,readIllustration,subscribeIllustration} from '@/lib/illustration-cache';
import {useIdentity} from './Identity';

const button='inline-flex min-h-11 items-center justify-center rounded-full border border-site-border-2 bg-white px-4 py-3 text-center text-small font-semibold text-site-ink disabled:opacity-50';
const RESOLUTIONS={'720':{width:1280,height:720},'1080':{width:1920,height:1080}} as const;
type ResolutionKey=keyof typeof RESOLUTIONS;
type Still={id:number;dataUrl:string;quality:FrameQuality|null};
const CAMERA_KEY='showonce-last-camera-v1',RES_KEY='showonce-camera-res-v1';
function loadStoredCamera(){try{return typeof window==='undefined'?null:window.localStorage.getItem(CAMERA_KEY);}catch{return null;}}
function saveStoredCamera(id:string){try{if(id&&typeof window!=='undefined')window.localStorage.setItem(CAMERA_KEY,id);}catch{}}
function clearStoredCamera(){try{if(typeof window!=='undefined')window.localStorage.removeItem(CAMERA_KEY);}catch{}}
function loadStoredRes():ResolutionKey{try{return typeof window!=='undefined'&&window.localStorage.getItem(RES_KEY)==='1080'?'1080':'720';}catch{return '720';}}
function saveStoredRes(value:ResolutionKey){try{if(typeof window!=='undefined')window.localStorage.setItem(RES_KEY,value);}catch{}}
type Props={lesson:Lesson;step:Step;progress:Progress;token:string|null;disabled:boolean;stopRef:{current:()=>void};initialLive:boolean;onFeedback:(value:Assessment)=>void;onClearFeedback?:()=>void;onError:(value:string|null)=>void;onChecksChange?:(observations:string[])=>void};

/** Local previews stay free. One selected picture or camera frame is sent only after explicit opt-in and a check click. */
export function LiveCamera({lesson,step,progress,token,disabled,stopRef,initialLive,onFeedback,onClearFeedback,onError,onChecksChange}:Props){
 const identity=useIdentity();
 const [mode,setMode]=useState<'camera'|'picture'>('camera'),[upload,setUpload]=useState<{name:string;mime_type:string;image_base64:string;epoch:number}|null>(null),[reading,setReading]=useState(false),[pictureReady,setPictureReady]=useState(false);
 const fileInput=useRef<HTMLInputElement|null>(null);
 const [shown,setShown]=useState(initialLive),[state,setState]=useState<'stopped'|'opening'|'preview'>('stopped'),[devices,setDevices]=useState<MediaDeviceInfo[]>([]),[stills,setStills]=useState<Still[]>([]),[selectedId,setSelectedId]=useState<number|null>(null),[checks,setChecks]=useState<string[]>([]),[consent,setConsent]=useState(false),[checking,setChecking]=useState(false),[message,setMessage]=useState<string|null>(null),[online,setOnline]=useState(true),[quality,setQuality]=useState<FrameQuality|null>(null),[qualityOverride,setQualityOverride]=useState(false),[target,setTarget]=useState<string|null>(null),[checksSent,setChecksSent]=useState(0),[torchOn,setTorchOn]=useState(false),[torchReady,setTorchReady]=useState(false),[focusPoint,setFocusPoint]=useState<{x:number;y:number}|null>(null),[focusReady,setFocusReady]=useState(false),[queued,setQueued]=useState<{mime_type:string;image_base64:string;label:string}|null>(null),[ghostOn,setGhostOn]=useState(false),[ghostOpacity,setGhostOpacity]=useState(50),[gridOn,setGridOn]=useState(false),[res,setRes]=useState<ResolutionKey>(loadStoredRes),[timer,setTimer]=useState<number|null>(null),[liveQuality,setLiveQuality]=useState<FrameQuality|null>(null),[zoom,setZoom]=useState(1),[zoomRange,setZoomRange]=useState<{min:number;max:number;step:number}|null>(null);
 const video=useRef<HTMLVideoElement|null>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0),opening=useRef(false),mounted=useRef(true),selected=useRef(''),facing=useRef<'user'|'environment'>('environment'),request=useRef<AbortController|null>(null),inFlight=useRef(false),qualityRef=useRef<FrameQuality|null>(null),targetURL=useRef<string|null>(null),targetFor=useRef<string|null>(null),previewBox=useRef<HTMLDivElement|null>(null),timerRef=useRef<number|null>(null),stillId=useRef(0),sampleCanvas=useRef<HTMLCanvasElement|null>(null);
 const stop=useCallback((preserveQueue?:boolean)=>{
  const preserve=preserveQueue===true;
  generation.current++;opening.current=false;request.current?.abort();request.current=null;inFlight.current=false;qualityRef.current=null;if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
  const previous=stream.current;stream.current=null;previous?.getTracks().forEach(track=>track.stop());
  if(video.current)video.current.srcObject=null;
  if(fileInput.current)fileInput.current.value='';
  if(mounted.current){setState('stopped');setChecking(false);setStills([]);setSelectedId(null);setUpload(null);setReading(false);setPictureReady(false);if(!preserve){setConsent(false);setChecks([]);setQueued(null);}setQuality(null);setQualityOverride(false);setTorchOn(false);setTorchReady(false);setFocusPoint(null);setFocusReady(false);setTimer(null);setLiveQuality(null);setZoom(1);setZoomRange(null);}
 },[]);
 useEffect(()=>{
  mounted.current=true;stopRef.current=stop;
  const hidden=()=>{if(document.hidden)stop(true);},background=()=>stop(true),connection=()=>{setOnline(navigator.onLine);if(!navigator.onLine){request.current?.abort();setChecking(false);setMessage('You’re offline. Local preview and self-comparison still work.');}};
  setOnline(navigator.onLine);document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',background);window.addEventListener('offline',connection);window.addEventListener('online',connection);
  return()=>{mounted.current=false;stop();if(targetURL.current){URL.revokeObjectURL(targetURL.current);targetURL.current=null;}document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',background);window.removeEventListener('offline',connection);window.removeEventListener('online',connection);if(stopRef.current===stop)stopRef.current=()=>{};};
 },[stop,stopRef]);
  const targetKey=illustrationKey(lesson.id,step.id),[targetVersion,bumpTarget]=useReducer(version=>version+1,0);
  useEffect(()=>subscribeIllustration(bumpTarget),[]);
  useEffect(()=>{
   if(!shown||target||targetFor.current===targetKey)return;
   const entry=readIllustration(targetKey);
   if(entry?.status!=='ready')return;
   try{const url=URL.createObjectURL(entry.blob);if(targetURL.current)URL.revokeObjectURL(targetURL.current);targetURL.current=url;targetFor.current=targetKey;if(mounted.current)setTarget(url);}catch{/* Written target remains. */}
  },[shown,targetKey,target,targetVersion]);
  useEffect(()=>{
   const list=step.assessment_criteria?.length?step.assessment_criteria:[step.expected_visual_result||step.instructions];
   onChecksChange?.(checks.map(index=>list[Number(index)]).filter((text):text is string=>!!text));
  },[checks,step,onChecksChange]);
  useEffect(()=>{
   if(!shown)return;
   const keys=(event:KeyboardEvent)=>{
    if(disabled||event.metaKey||event.ctrlKey||event.altKey)return;
    const element=(event.target||{}) as {tagName?:string;isContentEditable?:boolean};
    if(element.tagName==='INPUT'||element.tagName==='TEXTAREA'||element.tagName==='SELECT'||element.isContentEditable)return;
    if(event.key==='c'||event.key==='C'){if(checking||inFlight.current)return;event.preventDefault();capture();}
    else if(event.key==='Escape'&&state==='preview'){stop();}
   };
   window.addEventListener('keydown',keys);
   return()=>window.removeEventListener('keydown',keys);
  },[shown,disabled,state,stop,checking]);
  useEffect(()=>{
   if(state!=='preview'||mode!=='camera')return;
   const sample=()=>{
    if(document.hidden)return;
    const element=video.current;
    if(!element?.videoWidth||!element.videoHeight)return;
    try{
     const canvas=sampleCanvas.current||document.createElement('canvas');sampleCanvas.current=canvas;
     const ratio=Math.min(1,96/element.videoWidth);canvas.width=Math.max(1,Math.round(element.videoWidth*ratio));canvas.height=Math.max(1,Math.round(element.videoHeight*ratio));
     const context=canvas.getContext('2d');if(!context)return;
     context.drawImage(element,0,0,canvas.width,canvas.height);
     const assessed=qualityFromCanvas(canvas);
     if(assessed&&mounted.current)setLiveQuality(previous=>previous&&previous.ok===assessed.ok&&previous.dark===assessed.dark&&previous.bright===assessed.bright&&previous.blurry===assessed.blurry?previous:assessed);
    }catch{/* Live guide is best-effort; preview keeps working. */}
   };
   const timerID=window.setInterval(sample,800);
   return()=>window.clearInterval(timerID);
  },[state,mode]);
 async function open(id?:string){
  if(disabled||opening.current||stream.current)return;
  if(!navigator.mediaDevices?.getUserMedia){setMessage('This browser cannot open a camera here. Open the site directly over HTTPS, or use a photo or self-review.');return;}
  opening.current=true;setState('opening');setMessage(null);onClearFeedback?.();const epoch=++generation.current;
  const stored=!id?loadStoredCamera():null,resolution=RESOLUTIONS[res];
  try{
   let media:MediaStream|null=null,lastError:unknown=null;
   const candidates=id?[id]:stored?[stored,null]:[null];
   for(const candidate of candidates){
    try{media=await navigator.mediaDevices.getUserMedia({audio:false,video:{...(candidate?{deviceId:{exact:candidate}}:{facingMode:{ideal:facing.current}}),width:{ideal:resolution.width},height:{ideal:resolution.height}}});break;}
    catch(error){lastError=error;if((error as {name?:string}|null)?.name==='NotAllowedError')break;if(candidate)clearStoredCamera();}
   }
   if(!media)throw lastError||new Error('No camera was found.');
   if(!mounted.current||epoch!==generation.current){media.getTracks().forEach(track=>track.stop());return;}
   stream.current=media;const track=media.getVideoTracks()[0],settings=track?.getSettings();selected.current=settings?.deviceId||id||'';saveStoredCamera(selected.current);
   if(settings?.facingMode==='user'||settings?.facingMode==='environment')facing.current=settings.facingMode;
   else if(track?.label){if(/front|user|facetime|face\b/i.test(track.label))facing.current='user';else if(/back|rear|environment|world/i.test(track.label))facing.current='environment';}
   track?.addEventListener('ended',()=>{if(stream.current===media){stop();setMessage('Camera disconnected. Reconnect it and open the camera again, or continue with self-review.');}},{once:true});
   if(video.current){video.current.srcObject=media;try{await video.current.play();}catch{/* Native controls allow a manual play on restrictive browsers. */}}
   if(!mounted.current||epoch!==generation.current)return;setState('preview');
   try{const caps=(track?.getCapabilities?.()||{}) as {torch?:boolean;focusMode?:string[];zoom?:{min?:number;max?:number;step?:number}};if(mounted.current&&epoch===generation.current){setTorchReady(caps.torch===true);setFocusReady(!!caps.focusMode?.includes('single-shot'));const range=caps.zoom;if(range&&typeof range.min==='number'&&typeof range.max==='number'&&range.max>range.min){setZoomRange({min:range.min,max:range.max,step:range.step||0.1});setZoom(range.min);}else setZoomRange(null);}}catch{/* Torch, zoom and tap-to-focus stay hidden. */}
   try{const list=await navigator.mediaDevices.enumerateDevices();if(mounted.current&&epoch===generation.current)setDevices(list.filter(device=>device.kind==='videoinput'&&device.deviceId));}catch{/* Facing-mode switching remains available without device enumeration. */}
  }catch(error){if(mounted.current&&epoch===generation.current){setState('stopped');const name=(error as {name?:string}|null)?.name||'';setMessage(name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser’s site settings, then try again. Photo upload and self-review are still available.':name==='NotFoundError'?'No camera was found. Connect a camera, or use a photo or self-review.':name==='NotReadableError'?'The camera is busy. Close other apps using it and try again.':'Could not open that camera. Try again, use a photo, or self-review.');}}
  finally{if(mounted.current&&epoch===generation.current)opening.current=false;}
 }
 async function switchCamera(){
  if(disabled||opening.current||!stream.current)return;
  const next=devices.length>1?devices[(devices.findIndex(device=>device.deviceId===selected.current)+1)%devices.length]:null;
  facing.current=facing.current==='environment'?'user':'environment';if(!next)clearStoredCamera();stop();await open(next?.deviceId);
 }
 async function toggleTorch(){
  const track=stream.current?.getVideoTracks()[0] as (MediaStreamTrack&{applyConstraints?:(constraints:MediaTrackConstraints)=>Promise<void>})|undefined;
  if(!track?.applyConstraints||!torchReady||disabled)return;
  const next=!torchOn;
  try{await track.applyConstraints({advanced:[{torch:next} as unknown as MediaTrackConstraints]});if(mounted.current)setTorchOn(next);}
  catch{setMessage('The torch could not be switched. Your preview still works.');}
 }
 function refocus(event:{clientX:number;clientY:number;currentTarget:HTMLVideoElement}){
  const rect=event.currentTarget.getBoundingClientRect();
  let point:{x:number;y:number}|null=null;
  if(rect.width>0&&rect.height>0){point={x:Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width)),y:Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height))};setFocusPoint({x:point.x*100,y:point.y*100});}
  try{
   const track=stream.current?.getVideoTracks()[0] as (MediaStreamTrack&{applyConstraints?:(constraints:MediaTrackConstraints)=>Promise<void>;getCapabilities?:()=>{focusMode?:string[]}})|undefined;
   if(track?.applyConstraints&&(track.getCapabilities?.() as {focusMode?:string[]}|undefined)?.focusMode?.includes('single-shot'))void track.applyConstraints({advanced:[{focusMode:'single-shot',...(point?{pointsOfInterest:[point]}:{})} as unknown as MediaTrackConstraints]}).catch(()=>{if(mounted.current)setMessage('Tap-to-focus is unavailable. Your preview still works.');});
  }catch{/* Focus ring still shows where you tapped. */}
 }
 function goFullscreen(){
  const box=previewBox.current as (HTMLDivElement&{requestFullscreen?:()=>Promise<void>})|null;
  if(box?.requestFullscreen)void box.requestFullscreen().catch(()=>setMessage('Fullscreen was blocked. Your preview still works.'));
  else setMessage('Fullscreen is not available in this browser. Your preview still works.');
 }
 function changeZoom(value:number){
  setZoom(value);
  const track=stream.current?.getVideoTracks()[0] as (MediaStreamTrack&{applyConstraints?:(constraints:MediaTrackConstraints)=>Promise<void>})|undefined;
  if(track?.applyConstraints)void track.applyConstraints({advanced:[{zoom:value} as unknown as MediaTrackConstraints]}).catch(()=>setMessage('Zoom could not be changed. Your preview still works.'));
 }
 function changeResolution(next:ResolutionKey){
  if(next===res||disabled)return;setRes(next);saveStoredRes(next);
  const track=stream.current?.getVideoTracks()[0],wanted=RESOLUTIONS[next];
  if(track?.applyConstraints)void track.applyConstraints({width:{ideal:wanted.width},height:{ideal:wanted.height}}).catch(()=>{/* Next open uses the new resolution. */});
 }
 function cancelTimer(){if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}if(mounted.current)setTimer(null);}
 function startTimer(seconds=3){
  if(disabled||checking||state!=='preview')return;
  cancelTimer();setTimer(seconds);
  const epoch=generation.current;
  const tick=(left:number)=>{
   if(!mounted.current||epoch!==generation.current)return;
   if(checking||inFlight.current){timerRef.current=null;setTimer(null);return;}
   if(left<=1){timerRef.current=null;setTimer(null);capture();}
   else{setTimer(left-1);timerRef.current=window.setTimeout(()=>tick(left-1),1000);}
  };
  timerRef.current=window.setTimeout(()=>tick(seconds),1000);
 }
 function capture(preserveConsent?:boolean){
  const element=video.current;
  if(!stream.current||!element?.videoWidth||!element.videoHeight){setMessage('Wait until the camera picture appears, then try again.');return null;}
  const mirrored=facing.current==='user';
  cancelTimer();
  try{const canvas=document.createElement('canvas'),ratio=Math.min(1,960/element.videoWidth);canvas.width=Math.max(1,Math.round(element.videoWidth*ratio));canvas.height=Math.max(1,Math.round(element.videoHeight*ratio));const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');if(mirrored&&context.translate&&context.scale){context.translate(canvas.width,0);context.scale(-1,1);}context.drawImage(element,0,0,canvas.width,canvas.height);const image=canvas.toDataURL('image/jpeg',.8);const assessed=qualityFromCanvas(canvas),id=++stillId.current;qualityRef.current=assessed;setStills(previous=>[...previous.slice(-2),{id,dataUrl:image,quality:assessed}]);setSelectedId(id);setFocusPoint(null);setQueued(null);setQuality(assessed);setQualityOverride(false);if(preserveConsent!==true)setConsent(false);if(!assessed||assessed.ok)setMessage(null);onClearFeedback?.();return image;}catch{setMessage('Could not capture a still. You can continue with the live preview or upload a photo.');return null;}
 }
 function discardStill(){
  const rest=stills.filter(still=>still.id!==selectedId),next=rest.length?rest[rest.length-1]:null;
  setStills(rest);setSelectedId(next?next.id:null);setQuality(next?next.quality:null);qualityRef.current=next?next.quality:null;
  setQualityOverride(false);setConsent(false);setMessage(null);onClearFeedback?.();
 }
 function selectStill(id:number){
  if(checking||inFlight.current)return;
  if(id===selectedId)return;
  const found=stills.find(still=>still.id===id);if(!found)return;
  setSelectedId(id);setQuality(found.quality);qualityRef.current=found.quality;setQualityOverride(false);
 }
 function assessUpload(img:HTMLImageElement){
  try{const canvas=document.createElement('canvas'),ratio=Math.min(1,960/((img.naturalWidth||img.width||960)));canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width||960)*ratio));canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height||960)*ratio));const context=canvas.getContext('2d');if(!context)return;context.drawImage(img,0,0,canvas.width,canvas.height);const assessed=qualityFromCanvas(canvas);if(!assessed)return;qualityRef.current=assessed;setQuality(assessed);setQualityOverride(false);}catch{/* Quality gate is best-effort; upload still works. */}
 }
 function chooseMode(next:'camera'|'picture'){
  if(next===mode||disabled)return;stop();setMode(next);setMessage(null);onError(null);onClearFeedback?.();
 }
 async function choosePicture(file:File|null){
  if(disabled||!file)return;
  const epoch=++generation.current;request.current?.abort();request.current=null;inFlight.current=false;qualityRef.current=null;setChecking(false);setQueued(null);setUpload(null);setQuality(null);setQualityOverride(false);setReading(true);setPictureReady(false);setConsent(false);setMessage(null);onError(null);onClearFeedback?.();
  try{const data=await photoData(file);if(!mounted.current||epoch!==generation.current)return;setUpload({...data,name:file.name,epoch});}
  catch(error){if(mounted.current&&epoch===generation.current){if(fileInput.current)fileInput.current.value='';setMessage(error instanceof Error?error.message:'Could not read that picture. Choose another PNG, JPEG or WebP.');}}
  finally{if(mounted.current&&epoch===generation.current)setReading(false);}
 }
 function discardPicture(){stop();setMessage(null);onError(null);onClearFeedback?.();}
 const paidAvailable=aiChecksAvailable(identity.config),budgetText=paidAvailable?'$'+(identity.config?.budget?.remaining_usd??0).toFixed(2)+' remaining':identity.config?.budget?.paused?'paused':identity.config?.ai_available?'AI allowance unavailable':'AI unavailable';
 async function checkImage(){
  if(!consent||disabled||inFlight.current||step.photo_assessable===false)return;
  if(queued){void sendQueued();return;}
  let image:{mime_type:string;image_base64:string};
  if(mode==='picture'){if(!upload||!pictureReady||reading)return;image=upload;}
  else{const current=stills.find(still=>still.id===selectedId),frame=current?current.dataUrl:capture(true);if(!frame)return;image={mime_type:'image/jpeg',image_base64:frame.split(',')[1]};}
  const gate=qualityRef.current||quality;
  if(gate&&!gate.ok&&!qualityOverride){setMessage('Free check: '+gate.hints.join(' ')+' Retake for free, or tick Send anyway to use allowance.');return;}
  if(!online){setQueued({...image,label:mode==='picture'?'uploaded picture':'camera still'});setMessage('Saved on this device. Reconnect, then press Send queued check to use allowance. Your consent stays until you send or discard it.');return;}
  if(!paidAvailable)return;
  onClearFeedback?.();
  void transmit(image,mode==='picture'?'picture_':'frame_',()=>{});
 }
 async function sendQueued(){
  const pending=queued;
  if(!pending||!consent||!paidAvailable||disabled||inFlight.current||!online||step.photo_assessable===false)return;
  onClearFeedback?.();
  void transmit(pending,'queued_',sent=>{if(sent&&mounted.current)setQueued(null);});
 }
 async function transmit(image:{mime_type:string;image_base64:string},prefix:string,after:(sent:boolean)=>void){
  const epoch=generation.current,controller=new AbortController();request.current=controller;inFlight.current=true;setChecking(true);onError(null);
  try{const value=await identity.request<Assessment>('/api/assess',{session_id:progress.session_id,lesson_id:lesson.id,step_id:step.id,submission_id:prefix+crypto.randomUUID(),mime_type:image.mime_type,image_base64:image.image_base64},{token,signal:controller.signal});if(mounted.current&&epoch===generation.current&&!controller.signal.aborted){setChecksSent(sent=>sent+1);after(true);try{onFeedback(value);}catch{/* A parent feedback handler must not turn a confirmed send into an error or count it twice. */}}}
  catch(error){if(mounted.current&&epoch===generation.current&&!controller.signal.aborted){after(false);onError(error instanceof Error?error.message:'Image check failed. Continue with free self-review.');}}
  finally{if(request.current===controller){request.current=null;inFlight.current=false;if(mounted.current)setChecking(false);}}
 }
 const activeStill=stills.find(still=>still.id===selectedId)||null,criteria=step.assessment_criteria?.length?step.assessment_criteria:[step.expected_visual_result||step.instructions];
 return <section className="mt-6 border-t border-site-border pt-5" aria-label="Live camera practice">
  <button type="button" className="text-small font-semibold underline" aria-expanded={shown} disabled={disabled} onClick={()=>{if(shown)stop();setShown(value=>!value);}}>{shown?'Hide live camera':'Practice with live camera · free'}</button>
  {shown&&<div className="mt-4 space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-semibold">See it. Try it. Compare.</h3><span role="status" className="rounded-full bg-accent/15 px-3 py-1 text-small">{checksSent===0?'Free local preview · 0 uploads':'Free local preview · '+checksSent+(checksSent===1?' check sent · not stored':' checks sent · not stored')}</span></div>
   <p className="text-small text-site-muted">Keep your work in view while you follow this step. Preview, stills and the checklist stay on this device. No microphone or recording.</p><div className="rounded-2xl border border-site-border p-4" aria-label={'Target for step '+step.position}><p className="text-small font-semibold">Target · step {step.position}</p><div className={target?'mt-2 grid items-start gap-3 sm:grid-cols-[128px_1fr]':'mt-2'}>{target&&<img src={target} alt={'Target illustration: '+step.expected_visual_result} className="max-h-36 w-full rounded-xl bg-site-page object-contain"/>}<p className="text-small text-site-muted">{step.expected_visual_result}</p></div></div>
   <div className="grid grid-cols-2 gap-2" aria-label="Picture source">
    <button type="button" className={button} aria-pressed={mode==='camera'} disabled={disabled} onClick={()=>chooseMode('camera')}>Live camera</button>
    <button type="button" className={button} aria-pressed={mode==='picture'} disabled={disabled} onClick={()=>chooseMode('picture')}>Upload picture</button>
   </div>
   {mode==='picture'?<div className="space-y-3 rounded-2xl border border-site-border p-4">
    <label className="block text-small font-semibold">Choose a picture<input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full min-w-0 text-small" disabled={disabled} onChange={event=>void choosePicture(event.target.files?.[0]||null)}/></label>
    <p className="text-small text-site-muted">PNG, JPEG or WebP · up to 5 MiB. Choosing a picture is free and does not open your camera or send it to AI.</p>
    {reading&&<p role="status" className="text-small">Reading your picture…</p>}
    {upload&&<figure><img key={upload.epoch} src={'data:'+upload.mime_type+';base64,'+upload.image_base64} alt="Your selected picture for this checkpoint" className="max-h-80 w-full rounded-xl bg-site-page object-contain" onLoad={(event)=>{if(upload.epoch===generation.current){setPictureReady(true);assessUpload(event.currentTarget);}}} onError={()=>{if(upload.epoch===generation.current){qualityRef.current=null;setQuality(null);setQualityOverride(false);setUpload(null);setPictureReady(false);setMessage('This picture could not be displayed. Choose another PNG, JPEG or WebP.');if(fileInput.current)fileInput.current.value='';}}}/><figcaption className="mt-2 break-words text-small text-site-muted">{upload.name} · local preview</figcaption>{pictureReady&&!quality&&<p role="status" className="mt-2 text-small text-site-muted">Free clarity check was unavailable for this picture. You can still send it for the paid check below.</p>}{quality&&!quality.ok&&<div role="status" className="mt-2 rounded-xl bg-site-page p-3 text-small"><p>Free check: {quality.hints.join(" ")}</p><label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={qualityOverride} onChange={event=>setQualityOverride(event.target.checked)}/><span>Send anyway — use allowance even if unclear</span></label></div>}{quality&&quality.ok&&<p role="status" className="mt-2 text-small text-site-muted">Free check: looks clear and well lit.</p>}<button type="button" className="mt-2 min-h-11 text-small underline" onClick={discardPicture}>Discard picture</button></figure>}
   </div>:<><div ref={previewBox} className="space-y-4 fullscreen:bg-[#16161a] fullscreen:p-4 fullscreen:text-white fullscreen:overflow-y-auto"><div className="relative overflow-hidden rounded-2xl bg-[#16161a]">
    <video ref={video} autoPlay playsInline muted controls={state==='preview'} onClick={focusReady&&state==='preview'?refocus:undefined} className={'aspect-video w-full object-contain'+(focusReady&&state==='preview'?' cursor-crosshair':'')+(facing.current==='user'?' -scale-x-100':'')} aria-label="Your local camera preview"/>
    {ghostOn&&target&&state==='preview'&&<img src={target} alt="" aria-hidden="true" className={'pointer-events-none absolute inset-0 h-full w-full object-contain'+(facing.current==='user'?' -scale-x-100':'')} style={{opacity:ghostOpacity/100}}/>}
    {focusPoint&&state==='preview'&&<div aria-hidden="true" className="pointer-events-none absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300" style={{left:focusPoint.x+'%',top:focusPoint.y+'%'}}/>}{gridOn&&state==='preview'&&<div aria-hidden="true" className="pointer-events-none absolute inset-0"><div className="absolute inset-y-0 left-1/3 w-px bg-white/40"/><div className="absolute inset-y-0 left-2/3 w-px bg-white/40"/><div className="absolute inset-x-0 top-1/3 h-px bg-white/40"/><div className="absolute inset-x-0 top-2/3 h-px bg-white/40"/></div>}{timer!==null&&state==='preview'&&<div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center"><span aria-hidden="true" className="text-7xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">{timer}</span><span className="sr-only">Capturing in {timer} seconds</span></div>}
    {state==='stopped'&&<div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-small text-white/70">Open your camera when you’re ready</div>}
   </div>
   <p role="status" className="text-small">{checking?'Checking one frame with AI…':state==='opening'?'Waiting for camera permission…':state==='preview'?'Camera on · local preview only':'Camera stopped'}</p>{state==='preview'&&liveQuality&&<p role="status" className="text-small text-site-muted">{liveQuality.ok?'Live guide: light and focus look good.':'Live guide: '+liveQuality.hints.join(' ')+(liveQuality.dark&&torchReady&&!torchOn?' Try Torch on.':'')}</p>}
   {focusReady&&state==='preview'&&<p className="text-small text-site-muted">Tap the preview to refocus.</p>}
   <div className="grid grid-cols-2 gap-2">
    <button type="button" className={button} disabled={state!=='stopped'||disabled} onClick={()=>void open()}>Open camera</button>
    <button type="button" className={button} disabled={state!=='preview'||disabled||checking} onClick={()=>void switchCamera()}>Switch camera</button>
    <button type="button" className={button} disabled={state!=='preview'||disabled||checking} onClick={()=>capture()}>Capture still · free</button>
     <button type="button" className={button} disabled={state!=='preview'||disabled||checking} onClick={()=>{if(timer===null)startTimer();else cancelTimer();}}>{timer===null?'Self-timer · 3s':'Cancel ('+timer+')'}</button>
    <button type="button" className={button} disabled={state==='stopped'&&!checking&&!activeStill} onClick={()=>stop()}>Stop camera</button>
     {torchReady&&<button type="button" className={button} disabled={state!=='preview'||disabled||checking} aria-pressed={torchOn} onClick={()=>void toggleTorch()}>{torchOn?'Torch off':'Torch on'}</button>}
     <button type="button" className={button} disabled={state!=='preview'||disabled} onClick={goFullscreen}>Fullscreen</button>
     <button type="button" className={button} aria-pressed={gridOn} disabled={disabled} onClick={()=>setGridOn(value=>!value)}>Thirds grid</button>
     <label className={button+' gap-2'}>Resolution<select value={res} disabled={disabled||checking} onChange={event=>changeResolution(event.target.value as ResolutionKey)} className="bg-transparent font-semibold" aria-label="Camera resolution"><option value="720">720p</option><option value="1080">1080p</option></select></label>
   </div>
   <p className="text-small text-site-muted">Shortcuts: C captures a still · Esc stops the camera.</p>
   </div>
   {target&&state==='preview'&&<div className="space-y-2 rounded-2xl border border-site-border p-4"><label className="flex items-start gap-3 text-small"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={ghostOn} onChange={event=>setGhostOn(event.target.checked)}/><span>Ghost target over preview</span></label>{ghostOn&&<label className="block text-small">Overlay opacity<input type="range" min={10} max={90} step={5} value={ghostOpacity} onChange={event=>setGhostOpacity(Number(event.target.value))} className="mt-2 w-full" aria-label="Overlay opacity"/></label>}</div>}
   {zoomRange&&state==='preview'&&<div className="rounded-2xl border border-site-border p-4"><label className="block text-small">Zoom<input type="range" min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} value={zoom} onChange={event=>changeZoom(Number(event.target.value))} className="mt-2 w-full" aria-label="Zoom"/></label></div>}
   {activeStill&&<figure><div className={target?'grid gap-2 sm:grid-cols-2':''}><img src={activeStill.dataUrl} alt="Your local comparison still" className="max-h-80 w-full rounded-2xl bg-site-page object-contain"/>{target&&<img src={target} alt="Target for this checkpoint" className="max-h-80 w-full rounded-2xl bg-site-page object-contain"/>}</div><figcaption className="mt-2 text-small text-site-muted">{target?'Your still vs target · the still is what the AI check sends · cleared when you stop or leave this step':'Local still · this is what the AI check sends · cleared when you stop or leave this step'}</figcaption>{stills.length>1&&<div role="group" aria-label="Captured stills" className="mt-2 flex gap-2">{stills.map((still,index)=><button key={still.id} type="button" disabled={checking} aria-pressed={still.id===activeStill.id} aria-label={'Still '+(index+1)+(still.id===activeStill.id?' · selected':'')} onClick={()=>selectStill(still.id)} className={'overflow-hidden rounded-xl border-2'+(still.id===activeStill.id?' border-amber-400':' border-transparent')}><img src={still.dataUrl} alt="" aria-hidden="true" className="h-16 w-16 object-cover"/></button>)}</div>}{!quality&&<p role="status" className="mt-2 text-small text-site-muted">Free clarity check was unavailable for this still. You can still send it for the paid check below.</p>}{quality&&!quality.ok&&<div role="status" className="mt-2 rounded-xl bg-site-page p-3 text-small"><p>Free check: {quality.hints.join(" ")}</p><label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={qualityOverride} onChange={event=>setQualityOverride(event.target.checked)}/><span>Send anyway — use allowance even if unclear</span></label></div>}{quality&&quality.ok&&<p role="status" className="mt-2 text-small text-site-muted">Free check: looks clear and well lit.</p>}<button type="button" className="mt-2 mr-4 min-h-11 text-small underline" disabled={checking} onClick={()=>{try{const link=document.createElement('a');link.href=activeStill.dataUrl;link.download='showonce-step-'+step.position+'-still.jpg';document.body.appendChild(link);link.click();link.remove();}catch{setMessage('Saving was blocked. You can screenshot the still instead.');}}}>Save still to device</button><button type="button" className="mt-2 text-small underline" disabled={checking} onClick={discardStill}>Discard still</button></figure>}
   </>}
   {mode==='picture'&&checking&&<p role="status" className="text-small">Checking your selected picture with AI…</p>}
   {message&&<p role="alert" className="rounded-xl bg-site-page p-3 text-small">{message}</p>}
   <fieldset className="space-y-3 rounded-2xl border border-site-border p-4"><legend className="px-1 text-small font-semibold">Compare with your target</legend><p className="text-small text-site-muted">{step.expected_visual_result}</p>{criteria.map((criterion,index)=><label key={index} className="flex items-start gap-3 text-small"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-amber-500" checked={checks.includes(String(index))} onChange={event=>setChecks(previous=>event.target.checked?[...previous,String(index)]:previous.filter(value=>value!==String(index)))}/><span>{criterion}</span></label>)}<p className="text-small text-site-muted">These are your own observations. Checked items attach to your self-review and reports. Use the self-review button below to save practice progress.</p></fieldset>
   {queued&&<div role="status" className="rounded-2xl border border-site-border p-4 text-small"><p>Queued {queued.label} · saved on this device, not sent. It stays only while this practice remains open; reloading, backgrounding or changing steps can clear it. {online?'Press Send queued check below to use allowance.':'Reconnect, then press Send queued check below.'}</p><button type="button" className="mt-2 min-h-11 text-small underline" onClick={()=>{setQueued(null);setMessage(null);}}>Discard queued check</button></div>}
    {step.photo_assessable!==false&&<details className="rounded-2xl border border-site-border p-4"><summary className="cursor-pointer text-small">Optional AI check · uses existing allowance</summary><p className="my-3 text-small text-site-muted">A check sends {mode==='picture'?'the picture shown above':activeStill?'the still shown above':'one current camera frame'} to Meta. AI compares what is visible with this checkpoint’s criteria and can say it cannot tell. The image is not saved by this check; feedback is saved privately. It does not advance the step. There is no automatic stream or repeat check. Stop cancels waiting; a check already sent may still use allowance. Offline? Queue the check on this device and send it after reconnecting. A queued check stays only while this practice remains open; backgrounding, reloading or changing steps can clear it.</p><p className="mb-3 text-small text-site-muted">Shared allowance: {budgetText}.</p><label className="flex items-start gap-3 text-small"><input type="checkbox" checked={consent} disabled={checking} onChange={event=>setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0"/><span>{mode==='picture'?'Allow picture AI checks using the shared allowance':'Allow one-frame AI checks using the shared allowance'}</span></label><button type="button" className={button+' mt-3 w-full'} disabled={!consent||checking||disabled||(queued?false:mode==='picture'?!upload||!pictureReady||reading:state!=='preview'&&!activeStill)||(queued?!online||!paidAvailable:online&&!paidAvailable)} onClick={()=>void checkImage()}>{checking?'Checking…':queued?online?'Send queued check · uses AI allowance':'Queued · waiting for connection':!online?mode==='picture'?'Queue picture check · sends when online':'Queue frame check · sends when online':mode==='picture'?'Check uploaded picture · uses AI allowance':activeStill?'Check still · uses AI allowance':'Check one frame · uses AI allowance'}</button>{!paidAvailable&&<p className="mt-2 text-small text-site-muted">AI checks are unavailable. Free camera practice still works.</p>}</details>}
  </div>}
 </section>;
}
