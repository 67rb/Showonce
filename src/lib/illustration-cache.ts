/** Shared read-only cache for saved step illustrations (AI target images, never user photos).
 * StepIllustration populates it when the target card loads; LiveCamera reads it so the
 * compare view needs no second fetch and free flows keep making zero API calls. */
export type IllustrationEntry={status:'ready';blob:Blob}|{status:'missing'};
const cache=new Map<string,IllustrationEntry>();
const listeners=new Set<()=>void>();
const MAX_ENTRIES=30;
export function illustrationKey(lessonID:string,stepID:string){return lessonID+'|'+stepID;}
export function readIllustration(key:string):IllustrationEntry|undefined{return cache.get(key);}
export function writeIllustration(key:string,entry:IllustrationEntry){
 if(!cache.has(key)&&cache.size>=MAX_ENTRIES){const oldest=cache.keys().next().value;if(oldest!==undefined)cache.delete(oldest);}
 cache.set(key,entry);
 listeners.forEach(notify=>{try{notify();}catch{/* One bad listener never breaks the cache. */}});
}
export function subscribeIllustration(notify:()=>void){listeners.add(notify);return ()=>{listeners.delete(notify);};}
export function clearIllustrationCache(){cache.clear();}
