// @vitest-environment jsdom
import React from 'react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,cleanup,fireEvent} from '@testing-library/react';
import {VenomButton} from '@/components/venom-button/venom-button';
vi.mock('framer-motion',()=>({useReducedMotion:()=>false,motion:{button:React.forwardRef<HTMLButtonElement,Record<string,unknown>>(({whileTap,transition,...props},ref)=><button {...props} ref={ref}/>)}}));
let frames:Map<number,FrameRequestCallback>,counter:number,resize:ResizeObserverCallback;
const hidden=Object.getOwnPropertyDescriptor(document,'hidden');
function flush(time:number){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(time));}
beforeEach(()=>{
 frames=new Map();counter=0;Object.defineProperty(document,'hidden',{configurable:true,value:false});
 vi.stubGlobal('requestAnimationFrame',vi.fn((fn:FrameRequestCallback)=>{const id=++counter;frames.set(id,fn);return id;}));vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 vi.stubGlobal('Path2D',class {addPath(){}});vi.stubGlobal('matchMedia',()=>({matches:false}));
 vi.stubGlobal('ResizeObserver',class {constructor(fn:ResizeObserverCallback){resize=fn;}observe(){}disconnect(){}});vi.stubGlobal('IntersectionObserver',class {observe(){}disconnect(){}});
 const gl=new Proxy({},{get:(_target,key)=>typeof key==='string'&&key===key.toUpperCase()?1:vi.fn(()=>({}))});
 const context=new Proxy({},{get:(_target,key)=>String(key).startsWith('create')?()=>({addColorStop(){}}):vi.fn()});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(((type:string)=>type==='webgl'?gl:context) as unknown as typeof HTMLCanvasElement.prototype.getContext);
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){const isButton=this.tagName==='BUTTON';return {left:isButton?160:0,top:isButton?50:0,width:isButton?200:520,height:isButton?64:170,right:520,bottom:170} as DOMRect;});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();if(hidden)Object.defineProperty(document,'hidden',hidden);else delete (document as unknown as Record<string,unknown>).hidden;});
it('avoids idle layout reads but tracks every press-transform change and independent resize',()=>{
 const view=render(<VenomButton label="Start" cursor="native" autoplay={false}/>),button=view.getByRole('button');const bounds=vi.mocked(HTMLElement.prototype.getBoundingClientRect),initial=bounds.mock.calls.length;
 flush(16);flush(32);flush(48);expect(bounds).toHaveBeenCalledTimes(initial);
 button.style.transform='scale(.98)';flush(64);expect(bounds).toHaveBeenCalledTimes(initial+2);
 button.style.transform='scale(.96)';flush(80);expect(bounds).toHaveBeenCalledTimes(initial+4);
 button.style.transform='none';flush(96);expect(bounds).toHaveBeenCalledTimes(initial+6);flush(112);expect(bounds).toHaveBeenCalledTimes(initial+6);
 resize([],{} as ResizeObserver);expect(bounds.mock.calls.length).toBeGreaterThan(initial+6);
 Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));expect(frames.size).toBe(0);Object.defineProperty(document,'hidden',{configurable:true,value:false});fireEvent(document,new Event('visibilitychange'));expect(frames.size).toBe(1);view.unmount();expect(frames.size).toBe(0);
});
