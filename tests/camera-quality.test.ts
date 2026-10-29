import {describe,it,expect} from 'vitest';
import {assessImageData,DARK_THRESHOLD,BRIGHT_THRESHOLD} from '@/lib/camera-quality';

function solid(width:number,height:number,value:number){
 const data=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<width*height;i++){data[i*4]=value;data[i*4+1]=value;data[i*4+2]=value;data[i*4+3]=255;}
 return data;
}
function checker(width:number,height:number){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=(x+y)%2?230:25,i=(y*width+x)*4;data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;}
 return data;
}
/** Genuinely blown frame: near-solid 252-255, almost no surviving contrast. */
function blown(width:number,height:number){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=252+((x+y)%4),i=(y*width+x)*4;data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;}
 return data;
}
/** White paper in good light: ~91% paper at 250, ~9% dark pencil strokes (every 12th column at 30). */
function whitePaper(width:number,height:number){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=x%12===0?30:250,i=(y*width+x)*4;data[i]=v;data[i+1]=v;data[i+2]=v;data[i+3]=255;}
 return data;
}

describe('camera quality gate',()=>{
 it('flags dark frames',()=>{
  const q=assessImageData(solid(32,32,10),32,32);
  expect(q.dark).toBe(true);expect(q.ok).toBe(false);
  expect(q.brightness).toBeLessThan(DARK_THRESHOLD);
  expect(q.hints.join(' ')).toMatch(/dark/i);
 });
 it('flags washed-out frames',()=>{
  const q=assessImageData(blown(32,32),32,32);
  expect(q.bright).toBe(true);expect(q.ok).toBe(false);
  expect(q.brightness).toBeGreaterThan(BRIGHT_THRESHOLD);
  expect(q.hints.join(' ')).toMatch(/washed out/i);
 });
 it('passes white paper with dark pencil lines despite a bright mean',()=>{
  // Mean (~229) exceeds the old mean-only bright threshold, most paper samples are
  // at the clip point, but dark strokes keep contrast/stddev and sharpness high.
  const q=assessImageData(whitePaper(64,64),64,64);
  expect(q.brightness).toBeGreaterThan(BRIGHT_THRESHOLD);
  expect(q.dark).toBe(false);expect(q.bright).toBe(false);expect(q.blurry).toBe(false);
  expect(q.ok).toBe(true);expect(q.hints).toHaveLength(0);
 });
 it('flags a flat white clipped frame as washed out',()=>{
  const q=assessImageData(solid(32,32,255),32,32);
  expect(q.bright).toBe(true);expect(q.ok).toBe(false);
  expect(q.hints.join(' ')).toMatch(/washed out/i);
 });
 it('does not call a bright but unclipped flat frame washed out',()=>{
  // Boundary: mean above BRIGHT_THRESHOLD with zero contrast, but no sample is
  // clipped (>=250), so clipping — not brightness alone — must gate the flag.
  // The frame still fails overall as blurry; only the washed-out flag is absent.
  const q=assessImageData(solid(32,32,235),32,32);
  expect(q.brightness).toBeGreaterThan(BRIGHT_THRESHOLD);
  expect(q.bright).toBe(false);
  expect(q.hints.join(' ')).not.toMatch(/washed out/i);
  expect(q.blurry).toBe(true);expect(q.ok).toBe(false);
 });
 it('flags flat/blurry frames even at mid brightness',()=>{
  const q=assessImageData(solid(32,32,128),32,32);
  expect(q.blurry).toBe(true);expect(q.ok).toBe(false);
 });
 it('passes a sharp well-lit frame',()=>{
  const q=assessImageData(checker(32,32),32,32);
  expect(q.dark).toBe(false);expect(q.bright).toBe(false);expect(q.blurry).toBe(false);
  expect(q.ok).toBe(true);expect(q.hints).toHaveLength(0);
 });
 it('handles empty input without crashing',()=>{
  const q=assessImageData(new Uint8ClampedArray(0),0,0);
  expect(q.ok).toBe(false);
 });
});
