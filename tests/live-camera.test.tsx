/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {LiveCamera} from '@/components/learning/LiveCamera';
import {clearIllustrationCache,illustrationKey,writeIllustration} from '@/lib/illustration-cache';
import type {Assessment,Lesson,Progress} from '@/lib/learning';
const {request,config}=vi.hoisted(()=>({request:vi.fn(),config:{ai_available:true,budget:{paused:false,remaining_usd:4}}}));
vi.mock('@/components/learning/Identity',()=>({useIdentity:()=>({request,config})}));
const lesson:Lesson={id:'lesson_camera',title:'Practice',category:'Drawing',materials:[],steps:[{id:'step_1',position:1,instructions:'Draw a circle.',expected_visual_result:'A closed circle on paper.',assessment_criteria:['The outline is closed.'],visual_limits:[]}]};
const progress:Progress={session_id:'session_camera',lesson_id:lesson.id,status:'active',current_step_id:'step_1',completed_step_ids:[],completed_checkpoints:[],total_steps:1,updated_at:''};
let getUserMedia:ReturnType<typeof vi.fn>,tracks:{stop:ReturnType<typeof vi.fn>;getSettings:()=>{deviceId:string;facingMode:string};addEventListener:ReturnType<typeof vi.fn>}[],stopRef:{current:()=>void},clearFeedback:ReturnType<typeof vi.fn<()=>void>>,feedback:ReturnType<typeof vi.fn<(value:Assessment)=>void>>;
function media(id='back',facing='environment'){
 const track={stop:vi.fn(),getSettings:()=>({deviceId:id,facingMode:facing}),addEventListener:vi.fn()};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};
}
function show(initialLive=true,step=lesson.steps[0]){return render(<LiveCamera key={step.id} lesson={lesson} step={step} progress={progress} token="private" disabled={false} stopRef={stopRef} initialLive={initialLive} onFeedback={feedback} onClearFeedback={clearFeedback} onError={vi.fn()}/>);}
async function open(){fireEvent.click(screen.getByRole('button',{name:'Open camera'}));await screen.findByText('Camera on · local preview only');}
function frame(){const video=screen.getByLabelText('Your local camera preview');Object.defineProperty(video,'videoWidth',{value:1280,configurable:true});Object.defineProperty(video,'videoHeight',{value:720,configurable:true});}
beforeEach(()=>{
 clearIllustrationCache();window.localStorage.clear();tracks=[];getUserMedia=vi.fn(async()=>media());stopRef={current:()=>{}};feedback=vi.fn();clearFeedback=vi.fn();request.mockReset();config.ai_available=true;config.budget.paused=false;config.budget.remaining_usd=4;
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia,enumerateDevices:vi.fn(async()=>[{kind:'videoinput',deviceId:'back'},{kind:'videoinput',deviceId:'front'}])}});
 Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,bG9jYWw=');
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('free live camera practice',()=>{
 it('never asks permission on mount; preview, still capture and checklist make zero API calls',async()=>{
  show();expect(getUserMedia).not.toHaveBeenCalled();await open();frame();fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));expect(screen.getByAltText('Your local comparison still')).toBeTruthy();fireEvent.click(screen.getByRole('checkbox',{name:'The outline is closed.'}));expect(request).not.toHaveBeenCalled();expect(feedback).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));expect(tracks[0].stop).toHaveBeenCalledOnce();expect(screen.queryByAltText('Your local comparison still')).toBeNull();expect((screen.getByLabelText('Your local camera preview') as HTMLVideoElement).srcObject).toBeNull();
 });
 it('gives useful permission recovery without calling AI',async()=>{
  getUserMedia.mockRejectedValueOnce(new DOMException('denied','NotAllowedError'));show();fireEvent.click(screen.getByRole('button',{name:'Open camera'}));await screen.findByText(/Camera permission was denied/);await open();expect(request).not.toHaveBeenCalled();
 });
 it('stops a late permission reply after the user pressed Stop',async()=>{
  let release!:(value:ReturnType<typeof media>)=>void;getUserMedia.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));show();fireEvent.click(screen.getByRole('button',{name:'Open camera'}));fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));const late=media();await act(async()=>release(late));expect(tracks[0].stop).toHaveBeenCalledOnce();expect(screen.getByText('Camera stopped')).toBeTruthy();expect(request).not.toHaveBeenCalled();
 });
 it('stops and ignores a permission reply after unmount',async()=>{
  let release!:(value:ReturnType<typeof media>)=>void;getUserMedia.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));const view=show();fireEvent.click(screen.getByRole('button',{name:'Open camera'}));view.unmount();const late=media();await act(async()=>release(late));expect(tracks[0].stop).toHaveBeenCalledOnce();
 });
 it('releases the old device before switching and never starts paid feedback',async()=>{
  getUserMedia.mockImplementationOnce(async()=>media()).mockImplementationOnce(async()=>media('front','user'));show();await open();fireEvent.click(screen.getByRole('button',{name:'Switch camera'}));await waitFor(()=>expect(getUserMedia).toHaveBeenCalledTimes(2));expect(tracks[0].stop).toHaveBeenCalledOnce();expect(getUserMedia.mock.calls[1][0].video.deviceId).toEqual({exact:'front'});expect(request).not.toHaveBeenCalled();
 });
 it('offers facing-mode switching even when device enumeration is unavailable',async()=>{
  navigator.mediaDevices.enumerateDevices=vi.fn().mockRejectedValue(new Error('No enumeration'));show();await open();fireEvent.click(screen.getByRole('button',{name:'Switch camera'}));await waitFor(()=>expect(getUserMedia).toHaveBeenCalledTimes(2));expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({ideal:'user'});
 });
 it('clears local frames and releases the camera on background or page exit',async()=>{
  show();await open();frame();fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));expect(tracks[0].stop).toHaveBeenCalledOnce();expect(screen.queryByAltText('Your local comparison still')).toBeNull();Object.defineProperty(document,'hidden',{configurable:true,value:false});await open();fireEvent(window,new Event('pagehide'));expect(tracks[1].stop).toHaveBeenCalledOnce();
 });
 it('shows a reconnect path on device loss',async()=>{
  show();await open();act(()=>tracks[0].addEventListener.mock.calls[0][1]());await screen.findByText(/Camera disconnected/);expect(tracks[0].stop).toHaveBeenCalledOnce();expect(request).not.toHaveBeenCalled();
 });
 it('keeps local practice available offline and when the AI allowance is exhausted',async()=>{
  config.budget.remaining_usd=0;show();await open();frame();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));expect(screen.getByAltText('Your local comparison still')).toBeTruthy();expect((screen.getByRole('button',{name:'Queue frame check · sends when online'}) as HTMLButtonElement).disabled).toBe(true);expect(request).not.toHaveBeenCalled();
 });
 it('only sends a frame on explicit opt-in and click, never polls or advances progress',async()=>{
  request.mockResolvedValue({result:'uncertain',feedback:'Try brighter light.'});show();await open();frame();const check=screen.getByRole('button',{name:'Check one frame · uses AI allowance'});expect((check as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));fireEvent.click(check);await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0][0]).toBe('/api/assess');expect(request.mock.calls[0][1]).toMatchObject({session_id:progress.session_id,step_id:'step_1',image_base64:'bG9jYWw='});expect(request.mock.calls[0][2].token).toBe('private');expect(screen.queryByText(/Sampled AI feedback running/)).toBeNull();
 });
 it('aborts and suppresses late AI feedback when stopped',async()=>{
  let release!:(value:unknown)=>void;request.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));show();await open();frame();fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));fireEvent.click(screen.getByRole('button',{name:'Check one frame · uses AI allowance'}));fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));expect(request.mock.calls[0][2].signal.aborted).toBe(true);await act(async()=>release({result:'pass'}));expect(feedback).not.toHaveBeenCalled();expect(request).toHaveBeenCalledTimes(1);
 });
 it('self-review-only steps still offer free camera practice without AI controls',async()=>{
  show(true,{...lesson.steps[0],photo_assessable:false});await open();expect(screen.queryByText('Optional AI check · uses existing allowance')).toBeNull();expect(request).not.toHaveBeenCalled();
 });
 it('handles missing camera support without a crash',()=>{
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:undefined});show();fireEvent.click(screen.getByRole('button',{name:'Open camera'}));expect(screen.getByText(/This browser cannot open a camera here/)).toBeTruthy();expect(request).not.toHaveBeenCalled();
 });
 it('previews an uploaded picture without camera permission or network use and checks the exact selected bytes',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));const file=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'work.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[file]}});const preview=await screen.findByAltText('Your selected picture for this checkpoint');expect(getUserMedia).not.toHaveBeenCalled();expect(request).not.toHaveBeenCalled();
  const check=screen.getByRole('button',{name:'Check uploaded picture · uses AI allowance'});fireEvent.click(screen.getByRole('checkbox',{name:'Allow picture AI checks using the shared allowance'}));expect((check as HTMLButtonElement).disabled).toBe(true);fireEvent.load(preview);request.mockResolvedValue({result:'uncertain',feedback:'Need a clearer view.'});fireEvent.click(check);await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());expect(request).toHaveBeenCalledOnce();expect(request.mock.calls[0][1]).toMatchObject({mime_type:'image/png',image_base64:'iVBORw0KGgo=',step_id:'step_1',session_id:progress.session_id});expect(request.mock.calls[0][1].submission_id).toMatch(/^picture_/);expect(getUserMedia).not.toHaveBeenCalled();
 });
 it('rejects unsupported or oversized uploaded pictures before any AI call',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));const input=screen.getByLabelText('Choose a picture');fireEvent.change(input,{target:{files:[new File(['svg'],'work.svg',{type:'image/svg+xml'})]}});await screen.findByText(/Choose a PNG, JPEG or WebP/);expect(request).not.toHaveBeenCalled();fireEvent.change(input,{target:{files:[new File([new Uint8Array(5242881)],'large.png',{type:'image/png'})]}});await screen.findByText(/Choose a PNG, JPEG or WebP/);expect(screen.queryByAltText('Your selected picture for this checkpoint')).toBeNull();expect(request).not.toHaveBeenCalled();
 });
 it('discards undecodable pictures and keeps the paid action disabled',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[new File(['bad image'],'bad.png',{type:'image/png'})]}});fireEvent.error(await screen.findByAltText('Your selected picture for this checkpoint'));await screen.findByText(/This picture could not be displayed/);expect(screen.queryByAltText('Your selected picture for this checkpoint')).toBeNull();expect(request).not.toHaveBeenCalled();
 });
 it('changing pictures aborts old feedback, clears its display and requires a fresh explicit check',async()=>{
  let release!:(value:Assessment)=>void;request.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));show();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));const input=screen.getByLabelText('Choose a picture');fireEvent.change(input,{target:{files:[new File(['first'],'first.png',{type:'image/png'})]}});fireEvent.load(await screen.findByAltText('Your selected picture for this checkpoint'));fireEvent.click(screen.getByRole('checkbox',{name:'Allow picture AI checks using the shared allowance'}));fireEvent.click(screen.getByRole('button',{name:'Check uploaded picture · uses AI allowance'}));const previous=request.mock.calls[0][2].signal;clearFeedback.mockClear();fireEvent.change(input,{target:{files:[new File(['second'],'second.png',{type:'image/png'})]}});await screen.findByText('second.png · local preview');expect(previous.aborted).toBe(true);expect(clearFeedback).toHaveBeenCalled();expect((screen.getByRole('checkbox',{name:'Allow picture AI checks using the shared allowance'}) as HTMLInputElement).checked).toBe(false);await act(async()=>release({result:'pass',feedback:'Old result',corrections:[],requested_evidence:[],criteria:[]}));expect(feedback).not.toHaveBeenCalled();expect(request).toHaveBeenCalledOnce();
 });
 it('can upload after a denied camera and discards pictures on source switch',async()=>{
  getUserMedia.mockRejectedValueOnce(new DOMException('denied','NotAllowedError'));show();fireEvent.click(screen.getByRole('button',{name:'Open camera'}));await screen.findByText(/Camera permission was denied/);fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[new File(['photo'],'photo.jpg',{type:'image/jpeg'})]}});await screen.findByAltText('Your selected picture for this checkpoint');fireEvent.click(screen.getByRole('button',{name:'Live camera'}));expect(screen.queryByAltText('Your selected picture for this checkpoint')).toBeNull();expect(screen.getByText('Camera stopped')).toBeTruthy();expect(getUserMedia).toHaveBeenCalledOnce();expect(request).not.toHaveBeenCalled();
 });
 it('ignores a late file read after stop and releases the camera before picture mode',async()=>{
  const readers:FileReader[]=[];vi.spyOn(FileReader.prototype,'readAsDataURL').mockImplementation(function(this:FileReader){readers.push(this);});show();await open();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));expect(tracks[0].stop).toHaveBeenCalledOnce();fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[new File(['local'],'local.png',{type:'image/png'})]}});act(()=>stopRef.current());await act(async()=>{Object.defineProperty(readers[0],'result',{value:'data:image/png;base64,bG9jYWw='});readers[0].dispatchEvent(new ProgressEvent('load'));});expect(screen.queryByAltText('Your selected picture for this checkpoint')).toBeNull();expect(request).not.toHaveBeenCalled();
 });
 it('offers local picture comparison on self-review steps without manufacturing AI judgements',async()=>{
  show(true,{...lesson.steps[0],photo_assessable:false});fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[new File(['local'],'local.png',{type:'image/png'})]}});await screen.findByAltText('Your selected picture for this checkpoint');expect(screen.queryByRole('button',{name:'Check uploaded picture · uses AI allowance'})).toBeNull();expect(request).not.toHaveBeenCalled();
 });
 it('checks the visible still instead of capturing a fresh frame',async()=>{
  const toDataURL=HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>;
  toDataURL.mockReturnValueOnce('data:image/jpeg;base64,c3RpbGw=').mockReturnValue('data:image/jpeg;base64,ZnJlc2g=');
  request.mockResolvedValue({result:'uncertain',feedback:'Nice.'});show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  const callsAfterCapture=(toDataURL as unknown as {mock:{calls:unknown[]}}).mock.calls.length;
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
  expect(request.mock.calls[0][1]).toMatchObject({image_base64:'c3RpbGw='});
  expect((toDataURL as unknown as {mock:{calls:unknown[]}}).mock.calls.length).toBe(callsAfterCapture);
 });
 it('blocks a dark/blurry still behind a free warning until Send anyway',async()=>{
  const dark=new Uint8ClampedArray(4*4*4);
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:dark,width:4,height:4}))});
  request.mockResolvedValue({result:'pass',feedback:'Good.'});show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(await screen.findAllByText(/Free check:/)).not.toHaveLength(0);
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox',{name:/Send anyway/}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(request).toHaveBeenCalledOnce());
 });
 it('clears the comparison checklist on stop',async()=>{
  show();await open();
  const box=screen.getByRole('checkbox',{name:'The outline is closed.'});
  fireEvent.click(box);expect((box as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));
  expect((screen.getByRole('checkbox',{name:'The outline is closed.'}) as HTMLInputElement).checked).toBe(false);
  expect(request).not.toHaveBeenCalled();
 });
 it('discarding the still reverts the paid button to live-frame mode',async()=>{
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByRole('button',{name:'Check still · uses AI allowance'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Discard still'}));
  expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  expect(screen.getByRole('button',{name:'Check one frame · uses AI allowance'})).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('shows the cached target illustration beside the still with zero API calls',async()=>{
  vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:target');static revokeObjectURL=vi.fn();});
  writeIllustration(illustrationKey(lesson.id,'step_1'),{status:'ready',blob:new Blob(['target'],{type:'image/png'})});
  show();await open();frame();
  expect(await screen.findByAltText('Target illustration: A closed circle on paper.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Target for this checkpoint')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('picks up a target illustration that loads after the panel opens',async()=>{
  vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:target');static revokeObjectURL=vi.fn();});
  show();
  expect(screen.queryByAltText(/Target illustration:/)).toBeNull();
  await act(async()=>{writeIllustration(illustrationKey(lesson.id,'step_1'),{status:'ready',blob:new Blob(['late'],{type:'image/png'})});});
  expect(await screen.findByAltText('Target illustration: A closed circle on paper.')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('falls back to the written target when no illustration is saved',async()=>{
  writeIllustration(illustrationKey(lesson.id,'step_1'),{status:'missing'});
  show();await open();
  expect(screen.queryByAltText(/Target illustration:/)).toBeNull();
  expect(screen.getByLabelText('Target for step 1')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('counts paid checks in the trust badge without touching free flows',async()=>{
  request.mockResolvedValue({result:'uncertain',feedback:'Try brighter light.'});
  show();await open();frame();
  expect(screen.getByText('Free local preview · 0 uploads')).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check one frame · uses AI allowance'}));
  await waitFor(()=>expect(screen.getByText('Free local preview · 1 check sent · not stored')).toBeTruthy());
  expect(request).toHaveBeenCalledTimes(1);
 });
 it('shows the shared allowance balance next to the paid check',async()=>{
  show();
  expect(screen.getByText('Shared allowance: $4.00 remaining.')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('names the reason AI checks are unavailable',async()=>{
  config.budget.paused=true;show();
  expect(screen.getByText('Shared allowance: paused.')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('toggles the torch only when the device reports support',async()=>{
  const apply=vi.fn(async()=>{});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),getCapabilities:()=>({torch:true}),applyConstraints:apply};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  fireEvent.click(screen.getByRole('button',{name:'Torch on'}));
  await waitFor(()=>expect(apply).toHaveBeenCalledWith({advanced:[{torch:true}]}));
  fireEvent.click(screen.getByRole('button',{name:'Torch off'}));
  await waitFor(()=>expect(apply).toHaveBeenCalledWith({advanced:[{torch:false}]}));
  expect(request).not.toHaveBeenCalled();
 });
 it('hides the torch control when the device has no torch',async()=>{
  show();await open();
  expect(screen.queryByRole('button',{name:/Torch/})).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('refocuses where you tap and marks the spot',async()=>{
  const apply=vi.fn(async()=>{});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),getCapabilities:()=>({focusMode:['single-shot','continuous']}),applyConstraints:apply};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  expect(screen.getByText('Tap the preview to refocus.')).toBeTruthy();
  const video=screen.getByLabelText('Your local camera preview');
  video.getBoundingClientRect=()=>({left:0,top:0,width:200,height:100,x:0,y:0,right:200,bottom:100,toJSON:()=>{}} as DOMRect);
  fireEvent.click(video,{clientX:50,clientY:25});
  expect(apply).toHaveBeenCalledWith({advanced:[{focusMode:'single-shot',pointsOfInterest:[{x:0.25,y:0.25}]}]});
  const ring=document.body.querySelector('div.border-amber-300') as HTMLElement;
  expect(ring).not.toBeNull();
  expect(ring.style.left).toBe('25%');
  expect(ring.style.top).toBe('25%');
  expect(request).not.toHaveBeenCalled();
 });
 it('keeps the preview working when tap-to-focus is rejected',async()=>{
  const apply=vi.fn(async()=>{throw new Error('Unsupported focus constraint');});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),getCapabilities:()=>({focusMode:['single-shot']}),applyConstraints:apply};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();fireEvent.click(screen.getByLabelText('Your local camera preview'));
  expect(await screen.findByText('Tap-to-focus is unavailable. Your preview still works.')).toBeTruthy();
  expect(screen.getByText('Camera on · local preview only')).toBeTruthy();expect(request).not.toHaveBeenCalled();
 });
 it('opens the preview fullscreen when the browser allows it',async()=>{
  show();await open();
  const box=screen.getByLabelText('Your local camera preview').parentElement?.parentElement as HTMLElement&{requestFullscreen:ReturnType<typeof vi.fn>};
  box.requestFullscreen=vi.fn(async()=>{});
  fireEvent.click(screen.getByRole('button',{name:'Fullscreen'}));
  expect(box.requestFullscreen).toHaveBeenCalledOnce();
  expect(request).not.toHaveBeenCalled();
 });
 it('keeps the primary controls inside the fullscreen element so they stay usable',async()=>{
  show();await open();frame();
  const box=screen.getByLabelText('Your local camera preview').parentElement?.parentElement as HTMLElement&{requestFullscreen:ReturnType<typeof vi.fn>};
  expect(box).toBeTruthy();
  expect(box.className).toContain('fullscreen:bg-[#16161a]');
  expect(box.className).toContain('fullscreen:p-4');
  for(const name of ['Open camera','Switch camera','Capture still · free','Self-timer · 3s','Stop camera','Fullscreen'])expect(box.contains(screen.getByRole('button',{name}))).toBe(true);
  box.requestFullscreen=vi.fn(async()=>{});
  fireEvent.click(screen.getByRole('button',{name:'Fullscreen'}));
  expect(box.requestFullscreen).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));
  expect(tracks[0].stop).toHaveBeenCalledOnce();
  expect(screen.getByText('Camera stopped')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('keeps a live preview when disabled and works again after re-enabling',async()=>{
  const view=render(<LiveCamera lesson={lesson} step={lesson.steps[0]} progress={progress} token="private" disabled={false} stopRef={stopRef} initialLive={true} onFeedback={feedback} onClearFeedback={clearFeedback} onError={vi.fn()}/>);
  await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  const video=screen.getByLabelText('Your local camera preview') as HTMLVideoElement;
  expect(video.srcObject).not.toBeNull();
  view.rerender(<LiveCamera lesson={lesson} step={lesson.steps[0]} progress={progress} token="private" disabled={true} stopRef={stopRef} initialLive={true} onFeedback={feedback} onClearFeedback={clearFeedback} onError={vi.fn()}/>);
  expect(tracks[0].stop).not.toHaveBeenCalled();
  expect(screen.getByText('Camera on · local preview only')).toBeTruthy();
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  expect(video.srcObject).not.toBeNull();
  expect((screen.getByRole('button',{name:'Capture still · free'}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button',{name:'Switch camera'}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button',{name:'Self-timer · 3s'}) as HTMLButtonElement).disabled).toBe(true);
  view.rerender(<LiveCamera lesson={lesson} step={lesson.steps[0]} progress={progress} token="private" disabled={false} stopRef={stopRef} initialLive={true} onFeedback={feedback} onClearFeedback={clearFeedback} onError={vi.fn()}/>);
  expect(tracks[0].stop).not.toHaveBeenCalled();
  expect(screen.getByText('Camera on · local preview only')).toBeTruthy();
  expect((screen.getByRole('button',{name:'Capture still · free'}) as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
  view.unmount();
 });
 it('explains when fullscreen is unavailable',async()=>{
  show();await open();
  fireEvent.click(screen.getByRole('button',{name:'Fullscreen'}));
  await screen.findByText(/Fullscreen is not available/);
  expect(request).not.toHaveBeenCalled();
 });
 it('queues a check offline and sends the exact queued bytes after reconnecting',async()=>{
  request.mockResolvedValue({result:'uncertain',feedback:'Try brighter light.'});
  show();await open();frame();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Queue frame check · sends when online'}));
  await screen.findByText(/Queued camera still/);
  expect(request).not.toHaveBeenCalled();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent(window,new Event('online'));
  fireEvent.click(await screen.findByRole('button',{name:'Send queued check · uses AI allowance'}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0][0]).toBe('/api/assess');
  expect(request.mock.calls[0][1]).toMatchObject({image_base64:'bG9jYWw='});
  expect(request.mock.calls[0][1].submission_id).toMatch(/^queued_/);
 });
 it('discards a queued check without ever sending it',async()=>{
  show();await open();frame();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Queue frame check · sends when online'}));
  await screen.findByText(/Queued camera still/);
  fireEvent.click(screen.getByRole('button',{name:'Discard queued check'}));
  expect(screen.queryByText(/Queued camera still/)).toBeNull();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent(window,new Event('online'));
  expect(screen.queryByRole('button',{name:'Send queued check · uses AI allowance'})).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('replaces a queued check when you capture a fresher still',async()=>{
  show();await open();frame();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Queue frame check · sends when online'}));
  await screen.findByText(/Queued camera still/);
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.queryByText(/Queued camera still/)).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('overlays the target on the live preview with adjustable opacity',async()=>{
  vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:target');static revokeObjectURL=vi.fn();});
  writeIllustration(illustrationKey(lesson.id,'step_1'),{status:'ready',blob:new Blob(['target'],{type:'image/png'})});
  show();await open();
  await screen.findByAltText('Target illustration: A closed circle on paper.');
  fireEvent.click(screen.getByRole('checkbox',{name:'Ghost target over preview'}));
  const overlay=document.body.querySelector('img[aria-hidden="true"]') as HTMLImageElement;
  expect(overlay).not.toBeNull();
  expect(overlay.style.opacity).toBe('0.5');
  fireEvent.change(screen.getByLabelText('Overlay opacity'),{target:{value:'80'}});
  expect((document.body.querySelector('img[aria-hidden="true"]') as HTMLImageElement).style.opacity).toBe('0.8');
  expect(request).not.toHaveBeenCalled();
 });
 it('hides ghost controls when no target image is saved',async()=>{
  show();await open();
  expect(screen.queryByRole('checkbox',{name:'Ghost target over preview'})).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('overlays a thirds grid on the preview only',async()=>{
  show();await open();
  expect(document.body.querySelector('div.left-1\\/3')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Thirds grid'}));
  expect(screen.getByRole('button',{name:'Thirds grid'}).getAttribute('aria-pressed')).toBe('true');
  expect(document.body.querySelectorAll('div.bg-white\\/40')).toHaveLength(4);
  fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));
  expect(document.body.querySelector('div.left-1\\/3')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('mirrors the preview for the front camera',async()=>{
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'front',facingMode:'user'}),addEventListener:vi.fn()};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  expect(screen.getByLabelText('Your local camera preview').className).toContain('-scale-x-100');
  expect(request).not.toHaveBeenCalled();
 });
 it('leaves the rear preview unmirrored',async()=>{
  show();await open();
  expect(screen.getByLabelText('Your local camera preview').className).not.toContain('-scale-x-100');
  expect(request).not.toHaveBeenCalled();
 });
 it('mirrors captured stills to match a front preview',async()=>{
  const drawImage=vi.fn(),translate=vi.fn(),scale=vi.fn();
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage,translate,scale});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'front',facingMode:'user'}),addEventListener:vi.fn()};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(translate).toHaveBeenCalledWith(960,0);
  expect(scale).toHaveBeenCalledWith(-1,1);
  expect(request).not.toHaveBeenCalled();
 });
 it('reopens the last used camera',async()=>{
  window.localStorage.setItem('showonce-last-camera-v1','front');
  show();await open();
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({video:expect.objectContaining({deviceId:{exact:'front'}})}));
  expect(request).not.toHaveBeenCalled();
 });
 it('remembers the camera you opened',async()=>{
  show();await open();
  expect(window.localStorage.getItem('showonce-last-camera-v1')).toBe('back');
  expect(request).not.toHaveBeenCalled();
 });
 it('falls back to facing mode when the remembered camera is gone',async()=>{
  window.localStorage.setItem('showonce-last-camera-v1','gone');
  getUserMedia.mockRejectedValueOnce(new DOMException('gone','NotFoundError'));
  show();await open();
  expect(getUserMedia).toHaveBeenCalledTimes(2);
  expect(getUserMedia.mock.calls[1][0].video.facingMode).toEqual({ideal:'environment'});
  expect(window.localStorage.getItem('showonce-last-camera-v1')).toBe('back');
  expect(request).not.toHaveBeenCalled();
 });
 it('opens at 1080p after switching resolution',async()=>{
  show();
  fireEvent.change(screen.getByLabelText('Camera resolution'),{target:{value:'1080'}});
  await open();
  expect(getUserMedia.mock.calls[0][0].video.width).toEqual({ideal:1920});
  expect(getUserMedia.mock.calls[0][0].video.height).toEqual({ideal:1080});
  expect(window.localStorage.getItem('showonce-camera-res-v1')).toBe('1080');
  expect(request).not.toHaveBeenCalled();
 });
 it('applies resolution changes to the live preview',async()=>{
  const apply=vi.fn(async()=>{});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),applyConstraints:apply};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  fireEvent.change(screen.getByLabelText('Camera resolution'),{target:{value:'1080'}});
  expect(apply).toHaveBeenCalledWith({width:{ideal:1920},height:{ideal:1080}});
  expect(request).not.toHaveBeenCalled();
 });
 it('captures hands-free after a 3 second countdown',async()=>{
  show();await open();frame();
  vi.useFakeTimers();
  try{
   fireEvent.click(screen.getByRole('button',{name:'Self-timer · 3s'}));
   expect(screen.getByText('Capturing in 3 seconds')).toBeTruthy();
   await act(async()=>{vi.advanceTimersByTime(1000);});
   expect(screen.getByText('Capturing in 2 seconds')).toBeTruthy();
   await act(async()=>{vi.advanceTimersByTime(2000);});
   expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  }finally{vi.useRealTimers();}
  expect(request).not.toHaveBeenCalled();
 });
 it('cancels the countdown without capturing',async()=>{
  show();await open();frame();
  vi.useFakeTimers();
  try{
   fireEvent.click(screen.getByRole('button',{name:'Self-timer · 3s'}));
   fireEvent.click(screen.getByRole('button',{name:/Cancel \(/}));
   await act(async()=>{vi.advanceTimersByTime(5000);});
   expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  }finally{vi.useRealTimers();}
  expect(request).not.toHaveBeenCalled();
 });
 it('stops the countdown with the camera',async()=>{
  show();await open();frame();
  vi.useFakeTimers();
  try{
   fireEvent.click(screen.getByRole('button',{name:'Self-timer · 3s'}));
   fireEvent.click(screen.getByRole('button',{name:'Stop camera'}));
   await act(async()=>{vi.advanceTimersByTime(5000);});
   expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  }finally{vi.useRealTimers();}
  expect(request).not.toHaveBeenCalled();
 });
 it('captures with the C key',async()=>{
  show();await open();frame();
  fireEvent.keyDown(window,{key:'c'});
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('stops the camera with Escape',async()=>{
  show();await open();
  fireEvent.keyDown(window,{key:'Escape'});
  expect(tracks[0].stop).toHaveBeenCalledOnce();
  expect(request).not.toHaveBeenCalled();
 });
 it('ignores capture keys while typing',async()=>{
  show();await open();frame();
  fireEvent.keyDown(screen.getByLabelText('Camera resolution'),{key:'c'});
  expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('announces quality hints politely instead of as an alert',async()=>{
  const dark=new Uint8ClampedArray(4*4*4);
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:dark,width:4,height:4}))});
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(await screen.findAllByText(/Free check:/)).not.toHaveLength(0);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('keeps the last three stills with the newest selected',async()=>{
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);fireEvent.click(capture);
  expect(screen.getByRole('group',{name:'Captured stills'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Still 3 · selected'})).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });
 it('evicts the oldest still beyond three',async()=>{
  const toDataURL=HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>;
  toDataURL.mockReturnValueOnce('data:image/jpeg;base64,czE=').mockReturnValueOnce('data:image/jpeg;base64,czI=').mockReturnValueOnce('data:image/jpeg;base64,czM=').mockReturnValue('data:image/jpeg;base64,czQ=');
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);fireEvent.click(capture);fireEvent.click(capture);
  expect(screen.getByRole('group',{name:'Captured stills'}).querySelectorAll('button')).toHaveLength(3);
  expect((screen.getByAltText('Your local comparison still') as HTMLImageElement).src).toContain('czQ=');
  expect(request).not.toHaveBeenCalled();
 });
 it('checks the selected still instead of the newest',async()=>{
  const toDataURL=HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>;
  toDataURL.mockReturnValueOnce('data:image/jpeg;base64,Zmlyc3Q=').mockReturnValue('data:image/jpeg;base64,c2Vjb25k');
  request.mockResolvedValue({result:'pass',feedback:'Good.'});
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);
  fireEvent.click(screen.getByRole('button',{name:'Still 1'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
  expect(request.mock.calls[0][1]).toMatchObject({image_base64:'Zmlyc3Q='});
 });
 it('resets Send anyway when you switch stills',async()=>{
  const dark=new Uint8ClampedArray(4*4*4);
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:dark,width:4,height:4}))});
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);
  fireEvent.click(screen.getByRole('checkbox',{name:/Send anyway/}));
  expect((screen.getByRole('checkbox',{name:/Send anyway/}) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Still 1'}));
  expect((screen.getByRole('checkbox',{name:/Send anyway/}) as HTMLInputElement).checked).toBe(false);
  expect(request).not.toHaveBeenCalled();
 });
 it('keeps the paid check disabled with no preview and no still',async()=>{
  show();
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  expect((screen.getByRole('button',{name:'Check one frame · uses AI allowance'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Check one frame · uses AI allowance'}));
  expect(request).not.toHaveBeenCalled();
 });
 it('reports checked observations as criterion texts',async()=>{
  const seen:string[][]=[];render(<LiveCamera lesson={lesson} step={lesson.steps[0]} progress={progress} token="private" disabled={false} stopRef={stopRef} initialLive={true} onFeedback={feedback} onError={vi.fn()} onChecksChange={list=>{seen.push(list);}}/>);
  expect(seen[seen.length-1]).toEqual([]);
  fireEvent.click(screen.getByRole('checkbox',{name:'The outline is closed.'}));
  expect(seen[seen.length-1]).toEqual(['The outline is closed.']);
  fireEvent.click(screen.getByRole('checkbox',{name:'The outline is closed.'}));
  expect(seen[seen.length-1]).toEqual([]);
  expect(request).not.toHaveBeenCalled();
 });
 it('discarding the selected still falls back to the newest remaining',async()=>{
  const toDataURL=HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>;
  toDataURL.mockReturnValueOnce('data:image/jpeg;base64,Zmlyc3Q=').mockReturnValue('data:image/jpeg;base64,c2Vjb25k');
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);
  fireEvent.click(screen.getByRole('button',{name:'Still 1'}));
  fireEvent.click(screen.getByRole('button',{name:'Discard still'}));
  expect((screen.getByAltText('Your local comparison still') as HTMLImageElement).src).toContain('c2Vjb25k');
  expect(screen.queryByRole('group',{name:'Captured stills'})).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('guides framing live before any capture or payment',async()=>{
  const dark=new Uint8ClampedArray(4*4*4);
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:dark,width:4,height:4}))});
  show();await open();frame();
  expect(await screen.findByText(/Live guide:.*dark/i,undefined,{timeout:3000})).toBeTruthy();
  expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('applies zoom only when the device reports a zoom range',async()=>{
  const apply=vi.fn(async()=>{});
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),getCapabilities:()=>({zoom:{min:1,max:4,step:0.5}}),applyConstraints:apply};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  fireEvent.change(screen.getByLabelText('Zoom'),{target:{value:'2'}});
  expect(apply).toHaveBeenCalledWith({advanced:[{zoom:2}]});
  expect(request).not.toHaveBeenCalled();
 });
 it('hides zoom when the device has no zoom range',async()=>{
  show();await open();
  expect(screen.queryByLabelText('Zoom')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });
 it('saves the selected still to the device without any upload',async()=>{
  const clickSpy=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('button',{name:'Save still to device'}));
  expect(clickSpy).toHaveBeenCalledOnce();
  expect(request).not.toHaveBeenCalled();
 });
 it('clears the focus ring once the shot is captured',async()=>{
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),getSettings:()=>({deviceId:'back',facingMode:'environment'}),addEventListener:vi.fn(),getCapabilities:()=>({focusMode:['single-shot']}),applyConstraints:vi.fn(async()=>{})};tracks.push(track);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();frame();
  const video=screen.getByLabelText('Your local camera preview');
  video.getBoundingClientRect=()=>({left:0,top:0,width:200,height:100,x:0,y:0,right:200,bottom:100,toJSON:()=>{}} as DOMRect);
  fireEvent.click(video,{clientX:50,clientY:25});
  expect(document.body.querySelector('div.border-amber-300')).not.toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(screen.getByAltText('Your local comparison still')).toBeTruthy();
  expect(document.body.querySelector('div.border-amber-300')).toBeNull();
  expect(request).not.toHaveBeenCalled();
 });

 it('preserves consent for a check-initiated fresh frame behind the quality gate',async()=>{
  const dark=new Uint8ClampedArray(4*4*4);
  (HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:dark,width:4,height:4}))});
  request.mockResolvedValue({result:'pass',feedback:'Good.'});show();await open();frame();
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check one frame · uses AI allowance'}));
  expect(request).not.toHaveBeenCalled();
  expect((screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('checkbox',{name:/Send anyway/}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(request).toHaveBeenCalledOnce());
 });
 it('preserves consent when a check-initiated fresh frame is queued offline',async()=>{
  request.mockResolvedValue({result:'uncertain',feedback:'Try brighter light.'});
  show();await open();frame();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Queue frame check · sends when online'}));
  await screen.findByText(/Queued camera still/);
  expect((screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}) as HTMLInputElement).checked).toBe(true);
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent(window,new Event('online'));
  fireEvent.click(await screen.findByRole('button',{name:'Send queued check · uses AI allowance'}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledOnce();
 });
 it('blocks capture keys and still changes while a check is in flight',async()=>{
  let release!:(value:Assessment)=>void;request.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
  const toDataURL=HTMLCanvasElement.prototype.toDataURL as unknown as ReturnType<typeof vi.fn>;
  toDataURL.mockReturnValueOnce('data:image/jpeg;base64,Zmlyc3Q=').mockReturnValue('data:image/jpeg;base64,c2Vjb25k');
  show();await open();frame();
  const capture=screen.getByRole('button',{name:'Capture still · free'});
  fireEvent.click(capture);fireEvent.click(capture);
  fireEvent.click(screen.getByRole('button',{name:'Still 1'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await screen.findByText('Checking one frame with AI…');
  const calls=(toDataURL as unknown as {mock:{calls:unknown[]}}).mock.calls.length;
  fireEvent.keyDown(window,{key:'c'});
  const stillTwo=screen.getByRole('button',{name:'Still 2'}) as HTMLButtonElement;
  expect(stillTwo.disabled).toBe(true);fireEvent.click(stillTwo);
  expect(screen.getByRole('button',{name:'Still 1 · selected'})).toBeTruthy();
  expect((toDataURL as unknown as {mock:{calls:unknown[]}}).mock.calls.length).toBe(calls);
  await act(async()=>release({result:'pass',feedback:'Good.',corrections:[],requested_evidence:[],criteria:[]}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
 });
 it('does not let a self-timer fire while a check is in flight',async()=>{
  let release!:(value:Assessment)=>void;request.mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  vi.useFakeTimers();
  try{
   fireEvent.click(screen.getByRole('button',{name:'Self-timer · 3s'}));
   fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
   const before=(screen.getByAltText('Your local comparison still') as HTMLImageElement).src;
   await act(async()=>{vi.advanceTimersByTime(4000);});
   expect((screen.getByAltText('Your local comparison still') as HTMLImageElement).src).toBe(before);
   expect(screen.queryByRole('group',{name:'Captured stills'})).toBeNull();
  }finally{vi.useRealTimers();}
  await act(async()=>release({result:'pass',feedback:'Good.',corrections:[],requested_evidence:[],criteria:[]}));
 });
 it('counts only confirmed sends in the badge and isolates a throwing feedback handler',async()=>{
  request.mockRejectedValueOnce(new Error('Check failed.'));
  show();await open();frame();
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check one frame · uses AI allowance'}));
  await waitFor(()=>expect(request).toHaveBeenCalledOnce());
  await waitFor(()=>expect(screen.getByText('Free local preview · 0 uploads')).toBeTruthy());
  feedback.mockImplementationOnce(()=>{throw new Error('Parent failed');});
  request.mockResolvedValue({result:'pass',feedback:'Good.'});
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(screen.getByText('Free local preview · 1 check sent · not stored')).toBeTruthy());
  expect(feedback).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledTimes(2);
 });
 it('keeps a queued check, consent and checklist through backgrounding but clears stills',async()=>{
  request.mockResolvedValue({result:'uncertain',feedback:'Try brighter light.'});
  show();await open();frame();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'The outline is closed.'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Queue frame check · sends when online'}));
  await screen.findByText(/Queued camera still/);
  Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));
  expect(tracks[0].stop).toHaveBeenCalledOnce();
  expect(screen.queryByAltText('Your local comparison still')).toBeNull();
  expect(screen.getByText(/Queued camera still/)).toBeTruthy();
  expect(screen.getByText(/Queued camera still · saved on this device, not sent\. It stays only while this practice remains open; reloading, backgrounding or changing steps can clear it\./)).toBeTruthy();
  expect((screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole('checkbox',{name:'The outline is closed.'}) as HTMLInputElement).checked).toBe(true);
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent(window,new Event('online'));
  fireEvent.click(await screen.findByRole('button',{name:'Send queued check · uses AI allowance'}));
  await waitFor(()=>expect(feedback).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledOnce();
 });
 it('mirrors a labelled front camera when facingMode is missing',async()=>{
  getUserMedia.mockImplementationOnce(async()=>{const track={stop:vi.fn(),label:'FaceTime HD Camera',getSettings:()=>({deviceId:'front'}),addEventListener:vi.fn()};tracks.push(track as never);return {getTracks:()=>[track],getVideoTracks:()=>[track]};});
  show();await open();
  expect(screen.getByLabelText('Your local camera preview').className).toContain('-scale-x-100');
  expect(request).not.toHaveBeenCalled();
 });
 it('notes when the free clarity check is unavailable without blocking the paid check',async()=>{
  request.mockResolvedValue({result:'pass',feedback:'Good.'});
  show();await open();frame();
  fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));
  expect(await screen.findByText(/Free clarity check was unavailable for this still/)).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox',{name:'Allow one-frame AI checks using the shared allowance'}));
  fireEvent.click(screen.getByRole('button',{name:'Check still · uses AI allowance'}));
  await waitFor(()=>expect(request).toHaveBeenCalledOnce());
 });
 it('notes when the free clarity check is unavailable for an uploaded picture',async()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Upload picture'}));
  fireEvent.change(screen.getByLabelText('Choose a picture'),{target:{files:[new File(['photo'],'photo.jpg',{type:'image/jpeg'})]}});
  fireEvent.load(await screen.findByAltText('Your selected picture for this checkpoint'));
  expect(await screen.findByText(/Free clarity check was unavailable for this picture/)).toBeTruthy();
  expect(request).not.toHaveBeenCalled();
 });

});
