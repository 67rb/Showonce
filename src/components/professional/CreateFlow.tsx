"use client";
import {ProfessionalStudio} from './ProfessionalStudio';
// Supplied visual language, backed by private requests rather than demo timers.
export function CreateFlow({screen}:{screen:'create'|'processing'|'review'}){
 return <><ProfessionalStudio view="create"/>{screen!=='create'&&<p className="mx-auto max-w-lg px-4 pb-8 text-center text-small text-site-muted">Read your saved request status above. No processing stage or review result is simulated.</p>}</>;
}
