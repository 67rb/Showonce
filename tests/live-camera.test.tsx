// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {LiveCamera} from '@/components/learning/LiveCamera';
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
 tracks=[];getUserMedia=vi.fn(async()=>media());stopRef={current:()=>{}};feedback=vi.fn();clearFeedback=vi.fn();request.mockReset();config.ai_available=true;config.budget.paused=false;config.budget.remaining_usd=4;
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia,enumerateDevices:vi.fn(async()=>[{kind:'videoinput',deviceId:'back'},{kind:'videoinput',deviceId:'front'}])}});
 Object.defineProperty(navigator,'onLine',{value:true,configurable:true});
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/jpeg;base64,bG9jYWw=');
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
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
  config.budget.remaining_usd=0;show();await open();frame();Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));fireEvent.click(screen.getByRole('button',{name:'Capture still · free'}));expect(screen.getByAltText('Your local comparison still')).toBeTruthy();expect((screen.getByRole('button',{name:'Check one frame · uses AI allowance'}) as HTMLButtonElement).disabled).toBe(true);expect(request).not.toHaveBeenCalled();
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

});
