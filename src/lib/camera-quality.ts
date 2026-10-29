/** Free local frame quality gate. No network, no storage. Pure + canvas helper. */
export type FrameQuality={brightness:number;sharpness:number;dark:boolean;bright:boolean;blurry:boolean;hints:string[];ok:boolean};
export const DARK_THRESHOLD=45;
/** Mean-luminance gate for washed-out detection. Necessary but NOT sufficient on its own:
 *  white paper in good light routinely exceeds it while remaining perfectly readable. */
export const BRIGHT_THRESHOLD=225;
/** A sampled luminance at/above this counts as blown/clipped (at/near sensor saturation). */
export const BRIGHT_CLIP_LUMINANCE=250;
/** Washed-out requires at least this fraction of samples to be clipped. */
export const BRIGHT_CLIP_FRACTION=0.5;
/** Washed-out also requires luminance stddev below this (low contrast / blown detail).
 *  Dark pencil lines on white paper keep stddev far above it, so they are never flagged. */
export const BRIGHT_LOW_CONTRAST_STDDEV=25;
/** Laplacian variance below this reads as blurry on 96px previews. Tuned for paper/desk scenes. */
export const BLUR_THRESHOLD=35;

export function assessImageData(data:Uint8ClampedArray,width:number,height:number):FrameQuality{
 if(!data.length||!width||!height)return {brightness:0,sharpness:0,dark:true,bright:false,blurry:true,hints:['Could not read this frame. Try capturing again.'],ok:false};
 // Downsample to a small grayscale grid for speed (max ~96 on the long edge).
 const maxEdge=96,step=Math.max(1,Math.floor(Math.max(width,height)/maxEdge));
 const cols=Math.max(3,Math.floor(width/step)),rows=Math.max(3,Math.floor(height/step));
 const gray=new Float32Array(cols*rows);
 let sum=0,sumSq=0,clipped=0,count=0;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const px=Math.min(width-1,x*step),py=Math.min(height-1,y*step),i=(py*width+px)*4;
  if(i+2>=data.length)continue;
  const l=0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2];
  if(!Number.isFinite(l))continue;
  gray[y*cols+x]=l;sum+=l;sumSq+=l*l;if(l>=BRIGHT_CLIP_LUMINANCE)clipped++;count++;
 }
 const brightness=count&&Number.isFinite(sum/count)?sum/count:0;
 // Population luminance spread over the same sampled grid: high when dark strokes/content survive.
 const luminanceStdDev=count?Math.sqrt(Math.max(0,sumSq/count-brightness*brightness)):0;
 const clippedFraction=count?clipped/count:0;
 // Laplacian variance as a sharpness score.
 let lapSum=0,lapSq=0,lapCount=0;
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
  const c=gray[y*cols+x],lap=4*c-gray[(y-1)*cols+x]-gray[(y+1)*cols+x]-gray[y*cols+x-1]-gray[y*cols+x+1];
  lapSum+=lap;lapSq+=lap*lap;lapCount++;
 }
 const mean=lapCount?lapSum/lapCount:0;
 const sharpness=lapCount?Math.max(0,lapSq/lapCount-mean*mean):0;
 const dark=brightness<DARK_THRESHOLD;
 // Washed out = bright AND mostly clipped AND low contrast. Mean alone would falsely
 // flag a normal drawing on white paper (bright paper, dark lines, high stddev/sharp edges).
 const bright=brightness>BRIGHT_THRESHOLD&&clippedFraction>=BRIGHT_CLIP_FRACTION&&luminanceStdDev<BRIGHT_LOW_CONTRAST_STDDEV;
 const blurry=sharpness<BLUR_THRESHOLD;
 const hints:string[]=[];
 if(dark)hints.push('Image looks dark — add light and keep your work in view.');
 if(bright)hints.push('Image looks washed out — reduce glare or move out of direct light.');
 if(blurry)hints.push('Image looks blurry — hold steady, move closer, and tap to focus.');
 return {brightness:Math.round(brightness),sharpness:Math.round(sharpness*10)/10,dark,bright,blurry,hints,ok:hints.length===0};
}

/** Best-effort quality read from an already-drawn canvas. Returns null when unavailable (SSR/jsdom). */
export function qualityFromCanvas(canvas:HTMLCanvasElement):FrameQuality|null{
 try{
  const ctx=canvas.getContext('2d',{willReadFrequently:true}) as CanvasRenderingContext2D|null;
  if(!ctx||typeof ctx.getImageData!=='function')return null;
  const w=canvas.width,h=canvas.height;
  if(!w||!h)return null;
  const image=ctx.getImageData(0,0,w,h);
  const iw=(image.width||w),ih=(image.height||h);
  if(!image.data||!image.data.length)return null;
  return assessImageData(image.data as Uint8ClampedArray,iw,ih);
 }catch{return null;}
}
