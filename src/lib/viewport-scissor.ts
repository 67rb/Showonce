/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
/** Crop fragment work to the visible portion of a page-sized canvas, without
 * changing resolution, shader coordinates or the rendered visible pixels. */
export function viewportScissor(gl:WebGLRenderingContext,canvas:HTMLCanvasElement,overscan=160){
 let dirty=true,rect:DOMRect|null=null,disposed=false;
 const invalidate=()=>{dirty=true;};
 window.addEventListener('scroll',invalidate,{passive:true,capture:true});
 window.addEventListener('resize',invalidate,{passive:true});
 const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(invalidate);observer?.observe(canvas);
 const bounds=()=>{
  if(dirty||!rect||!observer){rect=canvas.getBoundingClientRect();dirty=false;}
  return rect;
 };
 return {
  bounds,
  apply(){
   if(disposed)return false;
   const rect=bounds();
   const width=canvas.width,height=canvas.height;
   if(rect.width<=0||rect.height<=0){gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,0,0);return false;}
   const sx=width/rect.width,sy=height/rect.height;
   const left=Math.max(0,Math.floor((-overscan-rect.left)*sx));
   const right=Math.min(width,Math.ceil((window.innerWidth+overscan-rect.left)*sx));
   const top=Math.max(0,Math.floor((-overscan-rect.top)*sy));
   const bottom=Math.min(height,Math.ceil((window.innerHeight+overscan-rect.top)*sy));
   gl.enable(gl.SCISSOR_TEST);
   gl.scissor(left,Math.max(0,height-bottom),Math.max(0,right-left),Math.max(0,bottom-top));
   return right>left&&bottom>top;
  },
  dispose(){disposed=true;observer?.disconnect();window.removeEventListener('scroll',invalidate,true);window.removeEventListener('resize',invalidate);gl.disable(gl.SCISSOR_TEST);}
 };
}
