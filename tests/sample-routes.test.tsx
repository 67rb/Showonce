/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {SampleFixture} from '@/components/learning/SampleFixture';

const root=process.cwd();
const sampleRoutes=[
 '/lesson/sample/play',
 '/lesson/sample/live',
 '/lesson/sample/play/camera',
 '/lesson/sample/complete',
];
const pageFile=(route:string)=>path.join(root,'src/app/(public)'+route+'/page.tsx');

afterEach(()=>cleanup());

describe('hobby sample routes stay the paper-cup sample',()=>{
 it('vercel redirects never shadow the static sample pages',()=>{
  const config=JSON.parse(readFileSync(path.join(root,'vercel.json'),'utf8')) as {redirects?:{source:string;destination:string}[]};
  const sources=new Map((config.redirects||[]).map(item=>[item.source,item.destination]));
  for(const route of sampleRoutes){
   expect(sources.has(route),route+' must not redirect away from the paper-cup sample').toBe(false);
   expect(existsSync(pageFile(route)),route+' must have a static page').toBe(true);
  }
  // No redirect may send any sample route to the drawing runtime lesson.
  for(const [source,destination] of sources){
   if(source.startsWith('/lesson/sample'))expect(destination).not.toContain('example_draw-shading');
  }
 });
 it('the sample player renders the paper-cup lesson, not drawing',()=>{
  render(<SampleFixture face="hobby" screen="play"/>);
  expect(screen.getByRole('heading',{name:'Fold a paper cup'})).toBeTruthy();
  expect(screen.getByText(/Square, corner up/)).toBeTruthy();
  expect(screen.queryByText(/draw|shading/i)).toBeNull();
 });
 it('the sample completion page is the paper-cup lesson',()=>{
  const source=readFileSync(pageFile('/lesson/sample/complete'),'utf8');
  expect(source).toContain('origamiSample');
  expect(source).not.toContain('example_draw-shading');
 });
});
