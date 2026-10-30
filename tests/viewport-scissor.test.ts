/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {viewportScissor} from '@/lib/viewport-scissor';
let resize:()=>void;
beforeEach(()=>{vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){}});Object.defineProperty(window,'innerWidth',{configurable:true,value:1280});Object.defineProperty(window,'innerHeight',{configurable:true,value:720});});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function setup(top=0,scale=1){const canvas=document.createElement('canvas');canvas.width=1280*scale;canvas.height=2106*scale;const bounds={left:0,top,width:1280,height:2106};const measure=vi.spyOn(canvas,'getBoundingClientRect').mockImplementation(()=>bounds as DOMRect);const gl={SCISSOR_TEST:3089,enable:vi.fn(),disable:vi.fn(),scissor:vi.fn()} as unknown as WebGLRenderingContext;return {canvas,bounds,measure,gl,crop:viewportScissor(gl,canvas)};}
it('keeps virtual canvas coordinates and resolution while cropping invisible fragment work',()=>{const {crop,canvas,gl,measure}=setup();expect(crop.apply()).toBe(true);expect(gl.scissor).toHaveBeenLastCalledWith(0,1226,1280,880);expect(canvas.height).toBe(2106);crop.apply();expect(measure).toHaveBeenCalledOnce();crop.dispose();});
it('recomputes the bottom-origin crop after scroll and includes all newly visible pixels',()=>{const {crop,bounds,gl}=setup();crop.apply();bounds.top=-900;window.dispatchEvent(new Event('scroll'));crop.apply();expect(gl.scissor).toHaveBeenLastCalledWith(0,326,1280,1040);crop.dispose();});
it('maps CSS pixels to a scaled backing buffer without moving shader coordinates',()=>{const {crop,gl}=setup(-900,2);crop.apply();expect(gl.scissor).toHaveBeenLastCalledWith(0,652,2560,2080);crop.dispose();});
it('handles resize, completely offscreen surfaces and empty canvas geometry',()=>{const {crop,bounds,gl}=setup(2000);expect(crop.apply()).toBe(false);bounds.top=0;bounds.height=0;resize();expect(crop.apply()).toBe(false);expect(gl.scissor).toHaveBeenLastCalledWith(0,0,0,0);bounds.height=2106;resize();expect(crop.apply()).toBe(true);crop.dispose();});
it('stops measuring and disables the crop on cleanup',()=>{const {crop,measure,gl}=setup();crop.apply();crop.dispose();window.dispatchEvent(new Event('scroll'));expect(crop.apply()).toBe(false);expect(measure).toHaveBeenCalledOnce();expect(gl.disable).toHaveBeenCalledWith(gl.SCISSOR_TEST);});
