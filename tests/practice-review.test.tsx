// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {buildPracticeRecap,PracticeReview} from '@/components/learning/PracticeReview';
import type {Lesson,Progress} from '@/lib/learning';

const lesson:Lesson={id:'lesson_one',title:'Paper practice',category:'craft',materials:[],steps:[{id:'first',position:1,title:'Make a fold',instructions:'Fold the paper along the center.',expected_visual_result:'A crease',assessment_criteria:[],visual_limits:[]},{id:'second',position:2,title:'Mark the edge',instructions:'Mark the edge with a pencil.',expected_visual_result:'A mark',assessment_criteria:[],visual_limits:[]}]};
const progress:Progress={session_id:'secret_session',lesson_id:lesson.id,access_token:'secret_token',status:'active',current_step_id:'second',completed_step_ids:['first'],completed_checkpoints:[{step_id:'first',kind:'self',observations:['private note']}],total_steps:2,updated_at:'2026-11-02'};
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

it('reveals completed instructions only after the learner chooses and records a self-rating',()=>{
 render(<PracticeReview lesson={lesson} progress={progress}/>);fireEvent.click(screen.getByText('Rehearse from memory'));expect(screen.getByText('What did you do in checkpoint 1?')).toBeTruthy();expect(screen.queryByText('Fold the paper along the center.')).toBeNull();expect(screen.queryByText('Mark the edge with a pencil.')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Reveal instructions'}));expect(screen.getByText('Fold the paper along the center.')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Revisit later'}));expect(screen.getByRole('status').textContent).toContain('1 to revisit');expect(progress.completed_step_ids).toEqual(['first']);
});
it('explains when no checkpoints are available',()=>{
 render(<PracticeReview lesson={lesson} progress={{...progress,completed_step_ids:[]}}/>);fireEvent.click(screen.getByText('Rehearse from memory'));expect(screen.getByText('Complete a checkpoint to create your first rehearsal card.')).toBeTruthy();
});
it('creates a recap without private tokens or observations',()=>{
 const text=buildPracticeRecap(lesson,progress);expect(text).toContain('1 of 2 checkpoints practiced');expect(text).toContain('Make a fold — practiced');expect(text).toContain('Mark the edge — not yet practiced');expect(text).not.toContain('secret_token');expect(text).not.toContain('secret_session');expect(text).not.toContain('private note');
});
it('offers a locally generated text file for download',()=>{
 vi.useFakeTimers();vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:recap');static revokeObjectURL=vi.fn();});const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});render(<PracticeReview lesson={lesson} progress={progress}/>);fireEvent.click(screen.getByRole('button',{name:'Download practice recap'}));expect(click).toHaveBeenCalledOnce();vi.advanceTimersByTime(1000);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recap');
});
