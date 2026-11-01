/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
// Supplied visual language. The review screen renders the real saved-request
// status from the studio loader (5.9); processing redirects to the create
// screen, where saving reports its status inline.
import {ProfessionalStudio} from './ProfessionalStudio';
export function CreateFlow({screen}:{screen:'create'|'processing'|'review'}){
 // processing is unreachable: its route redirects to /professional/create.
 if(screen==='processing')return null;
 return <ProfessionalStudio view="create"/>;
}
