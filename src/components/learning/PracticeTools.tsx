"use client";
import {useEffect,useState} from 'react';

const button='min-h-11 rounded-full border border-site-border-2 bg-white px-4 py-2 text-small font-semibold text-site-ink disabled:opacity-50';
function displayTime(seconds:number){const s=Math.floor(seconds);return `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor(s%3600/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;}

export function PracticeTools({sessionID}:{sessionID:string}){
 const [elapsed,setElapsed]=useState(0),[startedAt,setStartedAt]=useState<number|null>(null),[now,setNow]=useState(0);
 const [notes,setNotes]=useState(''),[saved,setSaved]=useState(''),[message,setMessage]=useState('');
 const key='showonce-practice-notes-v1:'+sessionID;
 // Local storage is unavailable during server rendering; load it after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const value=window.localStorage.getItem(key)||'';setNotes(value);setSaved(value);setMessage('');}catch{setNotes('');setSaved('');setMessage('Browser storage is unavailable. Notes cannot be saved on this device.');}},[key]);
 useEffect(()=>{if(startedAt===null)return;const interval=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(interval);},[startedAt]);
 const total=elapsed+(startedAt===null?0:Math.max(0,now-startedAt));
 function start(){const time=Date.now();setNow(time);setStartedAt(time);}
 function pause(){if(startedAt!==null)setElapsed(value=>value+Math.max(0,Date.now()-startedAt));setStartedAt(null);}
 function reset(){setStartedAt(null);setElapsed(0);setNow(0);}
 function save(){try{if(notes.trim())window.localStorage.setItem(key,notes);else{window.localStorage.removeItem(key);setNotes('');}setSaved(notes.trim()?notes:'');setMessage(notes.trim()?'Notes saved on this device.':'Notes removed from this device.');}catch{setMessage('Could not save notes on this device. Copy them before leaving this page.');}}
 function remove(){try{window.localStorage.removeItem(key);setNotes('');setSaved('');setMessage('Notes removed from this device.');}catch{setMessage('Could not remove the saved notes from this device.');}}
 return <section aria-labelledby="practice-tools-heading" className="rounded-[24px] border border-site-border bg-white p-5"><h2 id="practice-tools-heading" className="text-xl font-semibold">Practice tools</h2>
  <div className="mt-4"><h3 className="font-semibold">Practice timer</h3><p className="mt-1 text-small text-site-muted">Optional. Resets when you leave this page.</p><span role="timer" aria-live="off" aria-label="Practice timer" className="mt-2 block font-mono text-2xl tabular-nums">{displayTime(total/1000)}</span><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={startedAt===null?start:pause}>{startedAt===null?(elapsed?'Resume timer':'Start timer'):'Pause timer'}</button><button type="button" className={button} onClick={reset} disabled={startedAt===null&&elapsed===0}>Reset timer</button></div></div>
  <div className="mt-6 border-t border-site-border pt-5"><label htmlFor="practice-notes" className="font-semibold">Notes for this practice</label><p className="mt-1 text-small text-site-muted">Saved only in this browser on this device. Anyone using this browser can read them.</p><textarea id="practice-notes" className="mt-3 w-full rounded-2xl border border-site-border-2 bg-white p-4 text-site-ink" rows={4} maxLength={4000} value={notes} onChange={event=>{setNotes(event.target.value);setMessage('');}} placeholder="What would you like to remember?"/><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={save} disabled={notes===saved}>Save notes</button><button type="button" className={button} onClick={remove} disabled={!notes&&!saved}>Delete notes</button></div>{notes!==saved&&<p className="mt-2 text-small text-site-muted">Unsaved changes</p>}{message&&<p role="status" className="mt-2 text-small text-site-ink">{message}</p>}</div>
 </section>;
}
