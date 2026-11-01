// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {PracticeTools} from '@/components/learning/PracticeTools';

beforeEach(()=>window.localStorage.clear());
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});

it('starts, pauses, resumes and resets the optional timer',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));render(<PracticeTools sessionID="one"/>);
 const clock=screen.getByLabelText('Practice timer');expect(clock.textContent).toBe('00:00:00');
 fireEvent.click(screen.getByRole('button',{name:'Start timer'}));act(()=>vi.advanceTimersByTime(3200));expect(clock.textContent).toBe('00:00:03');
 fireEvent.click(screen.getByRole('button',{name:'Pause timer'}));act(()=>vi.advanceTimersByTime(5000));expect(clock.textContent).toBe('00:00:03');
 fireEvent.click(screen.getByRole('button',{name:'Resume timer'}));act(()=>vi.advanceTimersByTime(2000));expect(clock.textContent).toBe('00:00:05');fireEvent.click(screen.getByRole('button',{name:'Reset timer'}));expect(clock.textContent).toBe('00:00:00');
});
it('saves notes only when requested, restores them for the same session, and deletes them',()=>{
 const first=render(<PracticeTools sessionID="one"/>);fireEvent.change(screen.getByLabelText('Notes for this practice'),{target:{value:'Try a lighter grip.'}});expect(window.localStorage.length).toBe(0);fireEvent.click(screen.getByRole('button',{name:'Save notes'}));expect(screen.getByRole('status').textContent).toContain('saved on this device');first.unmount();
 const second=render(<PracticeTools sessionID="two"/>);expect((screen.getByLabelText('Notes for this practice') as HTMLTextAreaElement).value).toBe('');second.unmount();render(<PracticeTools sessionID="one"/>);expect((screen.getByLabelText('Notes for this practice') as HTMLTextAreaElement).value).toBe('Try a lighter grip.');fireEvent.click(screen.getByRole('button',{name:'Delete notes'}));expect(window.localStorage.length).toBe(0);
});
it('preserves unsaved text and reports a browser storage failure',()=>{
 render(<PracticeTools sessionID="one"/>);fireEvent.change(screen.getByLabelText('Notes for this practice'),{target:{value:'Keep this note.'}});vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('storage unavailable');});fireEvent.click(screen.getByRole('button',{name:'Save notes'}));expect(screen.getByRole('status').textContent).toContain('Could not save');expect((screen.getByLabelText('Notes for this practice') as HTMLTextAreaElement).value).toBe('Keep this note.');
});
