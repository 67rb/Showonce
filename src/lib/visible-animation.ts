/** Schedule unchanged animation frames only while their surface can be seen.
 * A draw returning false is idle until request() or visibility resumes it.
 */
export function visibleAnimation(element:Element,draw:(now:number,resumed:boolean)=>boolean|void,rootMargin='0px'){
 let frame:number|null=null,inView=true,disposed=false,resumed=true;
 const active=()=>!disposed&&inView&&!document.hidden;
 const request=()=>{if(active()&&frame===null)frame=window.requestAnimationFrame(tick);};
 function tick(now:number){frame=null;if(!active())return;const first=resumed;resumed=false;if(draw(now,first)!==false)request();}
 const synchronize=()=>{if(active()){if(resumed)request();}else{resumed=true;if(frame!==null)window.cancelAnimationFrame(frame);frame=null;}};
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;synchronize();},{rootMargin});
 observer?.observe(element);document.addEventListener('visibilitychange',synchronize);request();
 return {request,dispose(){disposed=true;if(frame!==null)window.cancelAnimationFrame(frame);frame=null;observer?.disconnect();document.removeEventListener('visibilitychange',synchronize);}};
}
