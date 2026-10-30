/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
import {SkyGate} from '@/components/SkyGate';
import CloudSky from '@/components/originkit/cloud-sky';
import {visibleAnimation} from '@/lib/visible-animation';
import {TextParticleAnimation} from '@/components/lightswind/text-particle-animation';
let frames:Map<number,FrameRequestCallback>,next:number,observers:{notify:(visible:boolean)=>void;disconnect:ReturnType<typeof vi.fn>}[];
const hidden=Object.getOwnPropertyDescriptor(document,'hidden');
function flush(time=16){const batch=[...frames.values()];frames.clear();for(const fn of batch)fn(time);}
beforeEach(()=>{
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 frames=new Map();next=0;observers=[];Object.defineProperty(document,'hidden',{configurable:true,value:false});
 vi.stubGlobal('requestAnimationFrame',vi.fn((fn:FrameRequestCallback)=>{const id=++next;frames.set(id,fn);return id;}));vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('IntersectionObserver',class {disconnect=vi.fn();notify:(visible:boolean)=>void;constructor(cb:IntersectionObserverCallback){this.notify=(visible)=>cb([{isIntersecting:visible} as IntersectionObserverEntry],this as unknown as IntersectionObserver);observers.push(this);}observe(){} });
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();if(hidden)Object.defineProperty(document,'hidden',hidden);else delete (document as unknown as Record<string,unknown>).hidden;});
describe('animation work follows visibility',()=>{
 it('keeps a single loop, cancels offscreen work and resumes with a fresh timebase',()=>{
  const draw=vi.fn(),animation=visibleAnimation(document.createElement('canvas'),draw);expect(frames.size).toBe(1);flush();expect(draw).toHaveBeenLastCalledWith(16,true);expect(frames.size).toBe(1);animation.request();observers[0].notify(true);expect(frames.size).toBe(1);flush(32);expect(draw).toHaveBeenLastCalledWith(32,false);
  observers[0].notify(false);expect(frames.size).toBe(0);animation.request();expect(frames.size).toBe(0);observers[0].notify(true);flush(10000);expect(draw).toHaveBeenLastCalledWith(10000,true);animation.dispose();expect(frames.size).toBe(0);expect(observers[0].disconnect).toHaveBeenCalledOnce();
 });
 it('rests without frame callbacks until invalidated and never wakes in a hidden tab',()=>{
  const draw=vi.fn(()=>false),animation=visibleAnimation(document.createElement('canvas'),draw);flush();expect(frames.size).toBe(0);observers[0].notify(true);expect(frames.size).toBe(0);animation.request();expect(frames.size).toBe(1);Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));expect(frames.size).toBe(0);animation.request();expect(frames.size).toBe(0);Object.defineProperty(document,'hidden',{configurable:true,value:false});fireEvent(document,new Event('visibilitychange'));flush(64);expect(draw).toHaveBeenLastCalledWith(64,true);animation.dispose();
 });
 it('supports browsers without IntersectionObserver and ignores callbacks after cleanup',()=>{
  vi.stubGlobal('IntersectionObserver',undefined);const draw=vi.fn(),animation=visibleAnimation(document.createElement('canvas'),draw),late=[...frames.values()][0];animation.dispose();late(16);expect(draw).not.toHaveBeenCalled();
 });
});
describe('particle rendering preserves visible behavior',()=>{
 function canvas(){const fillRect=vi.fn(),data=new Uint8ClampedArray(4*2*4);for(let i=0;i<data.length;i+=4)data.set([82,82,91,255],i);const context={font:'',textAlign:'',textBaseline:'',fillStyle:'',measureText:()=>({width:4,actualBoundingBoxAscent:2}),fillText:vi.fn(),getImageData:vi.fn(()=>({data})),clearRect:vi.fn(),fillRect};vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);return {context,fillRect};}
 it('draws the same two pixels once at exact rest and wakes for unchanged hover physics',()=>{
  const {fillRect,context}=canvas(),view=render(<TextParticleAnimation text="x" fontSize={2} padding={0} resolution={2} pixelSize={3} hoverRadius={4} repelForce={1} springForce={.1} friction={.8}/>);flush();expect(fillRect.mock.calls).toEqual([[0,0,3,3],[2,0,3,3]]);expect(frames.size).toBe(0);flush(32);expect(fillRect).toHaveBeenCalledTimes(2);
  const element=view.container.querySelector('canvas')!;vi.spyOn(element,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:4,height:2} as DOMRect);fireEvent.mouseMove(element,{clientX:1,clientY:0});expect(frames.size).toBe(1);flush(48);expect(fillRect.mock.calls[2][0]).toBeCloseTo(-.6,12);expect(fillRect.mock.calls[3][0]).toBeCloseTo(2.6,12);expect(frames.size).toBe(1);expect(context.getImageData).toHaveBeenCalledOnce();
 });
 it('retains its sampled particles while offscreen and releases all work on unmount',()=>{
  const {fillRect,context}=canvas(),view=render(<TextParticleAnimation text="x" fontSize={2} padding={0} resolution={2}/>);flush();const count=fillRect.mock.calls.length;observers[0].notify(false);fireEvent.mouseDown(view.container.querySelector('canvas')!,{clientX:1,clientY:0});expect(frames.size).toBe(0);flush(1000);expect(fillRect).toHaveBeenCalledTimes(count);observers[0].notify(true);flush(2000);expect(context.getImageData).toHaveBeenCalledOnce();view.unmount();expect(frames.size).toBe(0);
 });
});

describe('cloud work without changing cloud motion',()=>{
 function context(){
  vi.spyOn(HTMLCanvasElement.prototype,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:1280,height:800} as DOMRect);
  const calls:Record<string,ReturnType<typeof vi.fn>>={};
  const gl=new Proxy({}, {get(_target,name:string){if(name.toUpperCase()===name)return 1;return calls[name]||=vi.fn((...args:unknown[])=>name==='getUniformLocation'?args[1]:name.startsWith('create')?{}:name==='getShaderParameter'||name==='getProgramParameter'?true:undefined);}});
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(gl as WebGLRenderingContext);
  return calls;
 }
 it('draws each visible frame while uploading stable colors and settings only once',()=>{
  const calls=context(),view=render(<CloudSky background="#0075FF" baseColor="#B4D2F0" accentColor="#FFFFFF"/>);
  flush(16);const uniforms=calls.uniform1f.mock.calls.length;expect(calls.uniform3f).toHaveBeenCalledTimes(3);expect(calls.drawArrays).toHaveBeenCalledOnce();
  flush(32);expect(calls.drawArrays).toHaveBeenCalledTimes(2);expect(calls.uniform3f).toHaveBeenCalledTimes(3);expect(calls.uniform1f.mock.calls.length-uniforms).toBe(3);expect(calls.viewport).toHaveBeenCalledOnce();
  view.rerender(<CloudSky background="#FF0000" baseColor="#B4D2F0" accentColor="#FFFFFF"/>);flush(48);expect(calls.uniform3f).toHaveBeenCalledTimes(6);expect(calls.drawArrays).toHaveBeenCalledTimes(3);
  view.unmount();expect(frames.size).toBe(0);expect(calls.deleteProgram).toHaveBeenCalledOnce();
 });
 it('crops hidden cloud rows as the hero scrolls without resizing its framebuffer',()=>{
  Object.defineProperty(window,'innerWidth',{configurable:true,value:1280});Object.defineProperty(window,'innerHeight',{configurable:true,value:720});
  const calls=context(),view=render(<CloudSky width={1280} height={800}/>),canvas=view.container.querySelector('canvas')!;
  const rect={left:0,top:0,width:1280,height:800};vi.spyOn(canvas,'getBoundingClientRect').mockImplementation(()=>rect as DOMRect);
  flush(16);expect(calls.scissor).toHaveBeenLastCalledWith(0,0,1280,800);
  rect.top=-432;fireEvent.scroll(window);flush(32);expect(calls.scissor).toHaveBeenLastCalledWith(0,0,1280,528);expect(canvas.width).toBe(1280);expect(canvas.height).toBe(800);expect(calls.drawArrays).toHaveBeenCalledTimes(2);
 });
 it('keeps the same sky canvas and GPU program across offscreen pauses',()=>{
  vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false})));
  const calls=context(),view=render(<SkyGate/>),canvas=view.container.querySelector('canvas');
  expect(canvas).not.toBeNull();flush(16);const draws=calls.drawArrays.mock.calls.length;
  observers[0].notify(false);expect(frames.size).toBe(0);flush(32);expect(calls.drawArrays).toHaveBeenCalledTimes(draws);
  observers[0].notify(true);flush(48);expect(view.container.querySelector('canvas')).toBe(canvas);expect(calls.createProgram).toHaveBeenCalledOnce();expect(calls.drawArrays).toHaveBeenCalledTimes(draws+1);
 });
 it('coalesces pointer events into one geometry read using the latest position',()=>{
  const calls=context(),view=render(<CloudSky/>),canvas=view.container.querySelector('canvas')!;
  const rect=vi.spyOn(canvas,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:100,height:100} as DOMRect);
  for(let x=10;x<=90;x+=10)window.dispatchEvent(new MouseEvent('pointermove',{clientX:x,clientY:20}));
  expect(rect).not.toHaveBeenCalled();flush(16);expect(rect).toHaveBeenCalledOnce();expect(calls.drawArrays).toHaveBeenCalledOnce();flush(32);expect(rect).toHaveBeenCalledOnce();
  expect(calls.uniform2f.mock.calls.filter(row=>row[0]==='uParallax').some(row=>row[1]<0&&row[2]<0)).toBe(true);
 });
});
