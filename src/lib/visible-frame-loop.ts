/** Run visual work only while visible. Keeps elapsed animation time across pauses. */
export function createVisibleFrameLoop(element:Element,draw:(frame:{time:number;delta:number;reduced:boolean})=>void,{rootMargin='0px'}={}){
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 let inView=typeof IntersectionObserver==='undefined',disposed=false,dirty=true,raf=0,last:number|null=null,time=0;
 const allowed=()=>!disposed&&inView&&!document.hidden&&(!media.matches||dirty);
 const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=null;};
 const schedule=()=>{if(allowed()&&!raf)raf=requestAnimationFrame(tick);};
 function tick(now:number){raf=0;if(!allowed()){last=null;return;}const delta=last===null?0:Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(!media.matches)time+=delta;dirty=false;draw({time,delta,reduced:media.matches});schedule();}
 const visibility=()=>{if(document.hidden)stop();else schedule();};
 const motion=()=>{stop();dirty=true;schedule();};
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting);if(inView)schedule();else stop();},{rootMargin});
 observer?.observe(element);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);schedule();
 return {invalidate(){dirty=true;schedule();},dispose(){disposed=true;stop();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);}};
}
