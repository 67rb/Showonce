/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import catalogue from '../services/learning/hashir/public-site/web/professional-catalogue.json';
import CoursePreviewPage,{generateStaticParams} from '@/app/professional/course/[id]/page';
import {IdentityProvider} from '@/components/learning/Identity';

async function renderCourse(id:string){
 const element=await CoursePreviewPage({params:Promise.resolve({id})});
 return renderToString(<IdentityProvider>{element}</IdentityProvider>);
}

describe('professional course preview routes come from the canonical catalogue',()=>{
 it('generates a static route for every catalogue course plus the legacy alias',()=>{
  const ids=generateStaticParams().map(item=>item.id);
  for(const course of catalogue.courses)expect(ids).toContain(course.id);
  expect(ids).toContain('plumbing-foundations');
 });
 for(const course of catalogue.courses){
  it(`renders ${course.id} with its real lessons and anchors`,async()=>{
   const html=await renderCourse(course.id);
   expect(html).toContain(course.title);
   expect(html).toContain(course.trade);
   expect(html).not.toContain('← ←');
   for(const lessonID of course.lesson_ids){
    const lesson=catalogue.lessons.find(item=>item.id===lessonID)!;
    expect(html).toContain(`id="lesson-${lesson.id}"`);
    expect(html).toContain(lesson.title);
    for(const step of lesson.steps)expect(html).toContain(step.title);
   }
   // A course page must never borrow another course's lesson content.
   for(const other of catalogue.lessons.filter(item=>!course.lesson_ids.includes(item.id))){
    expect(html).not.toContain(other.title);
   }
   expect(html).toContain('/professional/lessons/');
   expect(html).toContain('does not grant instructor approval or a trade qualification');
  });
 }
 it('keeps the legacy plumbing-foundations URL as the plumbing course',async()=>{
  const html=await renderCourse('plumbing-foundations');
  const plumbing=catalogue.courses.find(course=>course.id==='plumbing')!;
  expect(html).toContain(plumbing.title);
  for(const lessonID of plumbing.lesson_ids)expect(html).toContain(`id="lesson-${lessonID}"`);
 });
 it('does not present the plumbing sample start as enrolment',async()=>{
  const html=await renderCourse('plumbing');
  expect(html).toContain('does not enrol');
  expect(html).toContain('Go to the training hub to enrol');
 });
});
