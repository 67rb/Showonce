// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,fireEvent,cleanup} from '@testing-library/react';
import ShaderBackground from '@/components/lightswind/shader-background';
let gl:Record<string,ReturnType<typeof vi.fn>|number>,frames:Map<number,FrameRequestCallback>,counter:number;
const hidden=Object.getOwnPropertyDescriptor(document,'hidden');
beforeEach(()=>{
 frames=new Map();counter=0;gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8};
 for(const name of ['enable','disable','scissor','createShader','shaderSource','compileShader','getShaderParameter','deleteShader','createProgram','attachShader','linkProgram','getProgramParameter','useProgram','createBuffer','bindBuffer','bufferData','getAttribLocation','enableVertexAttribArray','vertexAttribPointer','getUniformLocation','uniform3f','uniform2f','uniform1f','viewport','drawArrays','deleteBuffer','deleteProgram'])gl[name]=vi.fn(()=>({}));
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(gl as unknown as WebGLRenderingContext);
 vi.stubGlobal('requestAnimationFrame',vi.fn((fn:FrameRequestCallback)=>{const id=++counter;frames.set(id,fn);return id;}));vi.stubGlobal('cancelAnimationFrame',vi.fn((id:number)=>frames.delete(id)));
 Object.defineProperty(document,'hidden',{configurable:true,value:false});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();if(hidden)Object.defineProperty(document,'hidden',hidden);else delete (document as unknown as Record<string,unknown>).hidden;});
describe('animated background resource lifecycle',()=>{
 it('keeps one program and one frame loop through pointer movement and parent renders',()=>{
  const view=render(<ShaderBackground/>),canvas=view.container.querySelector('canvas')!;
  for(let i=0;i<100;i++)fireEvent.mouseMove(canvas,{clientX:i,clientY:i});view.rerender(<ShaderBackground/>);
  expect(gl.createShader).toHaveBeenCalledTimes(2);expect(gl.createProgram).toHaveBeenCalledTimes(1);expect(frames.size).toBe(1);
  const callback=[...frames.values()][0],draws=(gl.drawArrays as ReturnType<typeof vi.fn>).mock.calls.length;view.unmount();expect(frames.size).toBe(0);callback(16);expect(gl.drawArrays).toHaveBeenCalledTimes(draws);expect(gl.deleteProgram).toHaveBeenCalledOnce();expect(gl.deleteBuffer).toHaveBeenCalledOnce();expect(gl.deleteShader).toHaveBeenCalledTimes(2);
 });
 it('pauses a hidden tab and resumes exactly one animation loop',()=>{
  render(<ShaderBackground/>);Object.defineProperty(document,'hidden',{configurable:true,value:true});fireEvent(document,new Event('visibilitychange'));expect(frames.size).toBe(0);
  Object.defineProperty(document,'hidden',{configurable:true,value:false});fireEvent(document,new Event('visibilitychange'));fireEvent(document,new Event('visibilitychange'));expect(frames.size).toBe(1);
 });
 it('bounds GPU framebuffer size on a long library while preserving aspect ratio',()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'clientWidth','get').mockReturnValue(1000);vi.spyOn(HTMLCanvasElement.prototype,'clientHeight','get').mockReturnValue(10000);
  const view=render(<ShaderBackground/>),canvas=view.container.querySelector('canvas')!;expect(canvas.width).toBe(192);expect(canvas.height).toBe(1920);
 });
});
