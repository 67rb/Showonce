// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {ProfessionalStudio} from '@/components/professional/ProfessionalStudio';
const {request,identity}=vi.hoisted(()=>{const request=vi.fn();return {request,identity:{ready:true,account:{authenticated:true,user:{id:'learner'},is_admin:false},config:{ai_available:true,budget:{limit_usd:5,remaining_usd:4.5,paused:false}},request}};});
vi.mock('@/components/learning/Identity',()=>({useIdentity:()=>identity,AccountBar:()=> <p>Account controls</p>}));
vi.mock('@/components/Reveal',()=>({SerifAccent:({text}:{text:string})=><>{text}</>}));
vi.mock('@/components/lightswind/border-beam',()=>({BorderBeam:()=>null}));
const course={id:'plumbing',title:'Plumbing foundations',trade:'Plumbing',level:'Foundation',content_status:'Starter curriculum',description:'Identify common fittings and plan supervised, disconnected practice.',prerequisites:['Classroom only.'],lessons:[{id:'first',title:'Identify components',steps:3},{id:'second',title:'Plan supervised work',steps:3}]};
beforeEach(()=>{request.mockReset();identity.config.ai_available=true;identity.account.authenticated=true;vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:work-photo');static revokeObjectURL=vi.fn();});request.mockImplementation(async(path:string,body?:unknown)=>{if(path==='/v1/professional/courses')return {courses:[course]};if(path==='/v1/professional/enrollments')return {enrollments:[]};if(path==='/v1/professional/requests')return body?{id:'request',status:'draft'}:{requests:[]};if(path==='/v1/library')return {entries:[]};throw Error('Unexpected request '+path);});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('saves a goal, photo and tutorial link with one free idempotent request and never starts AI',async()=>{
 render(<ProfessionalStudio/>);await screen.findByText('No learning requests saved yet.');
 fireEvent.change(screen.getByLabelText('Your trade'),{target:{value:'Electrical'}});fireEvent.change(screen.getByLabelText('Experience level'),{target:{value:'some_experience'}});fireEvent.change(screen.getByLabelText('What should you be able to do? (optional)'),{target:{value:'Explain symbols to my instructor'}});fireEvent.change(screen.getByLabelText('What do you want to learn?'),{target:{value:'Identify my training components'}});fireEvent.change(screen.getByLabelText('Tutorial link (optional)'),{target:{value:'https://example.com/tutorial'}});fireEvent.change(screen.getByLabelText('Photo of what you’re doing (optional)'),{target:{files:[new File(['local-photo'],'work.png',{type:'image/png'})]}});fireEvent.click(screen.getByRole('checkbox',{name:'Classroom or disconnected training only.'}));fireEvent.submit(screen.getByRole('form',{name:'Professional learning request'}));
 await screen.findByText(/Saved privately. No AI call was made/);const writes=request.mock.calls.filter(([path,body])=>path==='/v1/professional/requests'&&body);expect(writes).toHaveLength(1);expect(writes[0][1]).toMatchObject({goal:'Identify my training components',trade:'Electrical',experience_level:'some_experience',success_criteria:'Explain symbols to my instructor',source_url:'https://example.com/tutorial',training_only:true,mime_type:'image/png',image_base64:btoa('local-photo')});expect(writes[0][2].key).toBeTruthy();expect(request.mock.calls.some(([path])=>path.endsWith('/plan'))).toBe(false);
});
it('requires explicit consent before an AI plan and renders real saved status',async()=>{
 const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/requests'&&!body?{requests:[{id:'r',goal:'My real goal',status:'draft',has_photo:false,source_url:null,href:null}]}:base(path,body,options));render(<ProfessionalStudio/>);const button=await screen.findByRole('button',{name:'Create AI practice plan · uses allowance'});expect((button as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('checkbox',{name:/Send my goal/}));expect((button as HTMLButtonElement).disabled).toBe(false);expect(screen.queryByText(/4 of 4/)).toBeNull();expect(request.mock.calls.some(([path])=>path.endsWith('/plan'))).toBe(false);
});
it('shows server course progress and locks the next lesson until the previous lesson is complete',async()=>{
 const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/enrollments'?{enrollments:[{id:'enrollment',version:1,status:'learning',course,practice_complete:false,reviews:[],lessons:[{id:'first',title:'Identify components',total_steps:3,completed_steps:1,session_id:'session'},{id:'second',title:'Plan supervised work',total_steps:3,completed_steps:0,session_id:null}]}]}:base(path,body,options));render(<ProfessionalStudio view="library"/>);const progress=await screen.findByRole('progressbar',{name:'Plumbing foundations practice progress'});expect((progress as HTMLProgressElement).value).toBe(1);expect((progress as HTMLProgressElement).max).toBe(6);fireEvent.click(screen.getByText('Lesson checkpoints'));expect((screen.getByRole('button',{name:'Finish previous lesson first'}) as HTMLButtonElement).disabled).toBe(true);expect((screen.getByRole('button',{name:'Request instructor review'}) as HTMLButtonElement).disabled).toBe(true);
});
it('blocks invalid photo files locally without sending a request',async()=>{render(<ProfessionalStudio/>);await waitFor(()=>expect(screen.queryByText('Loading saved learning…')).toBeNull());fireEvent.change(screen.getByLabelText('Photo of what you’re doing (optional)'),{target:{files:[new File(['bad'],'work.txt',{type:'text/plain'})]}});expect(screen.getByRole('alert').textContent).toContain('PNG, JPEG or WebP');expect(request.mock.calls.some(([,body])=>body)).toBe(false);});

it('shows the server course description and saved briefs shortcut in the training hub',async()=>{
 const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/requests'&&!body?{requests:[{id:'r',goal:'Learn to identify valves',trade:'Plumbing',status:'draft',has_photo:false,source_url:null,href:null}]}:base(path,body,options));render(<ProfessionalStudio view="library"/>);
 expect(await screen.findByText('Identify common fittings and plan supervised, disconnected practice.')).toBeTruthy();
 expect(await screen.findByRole('heading',{name:'Saved training briefs'})).toBeTruthy();
 expect(screen.getByText('Learn to identify valves')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Open in New training brief'}).getAttribute('href')).toBe('/professional/create/');
});
it('keeps resumed lesson and return links inside the professional UI without leaking capabilities',async()=>{
 const {lessonHref,workspaceHref}=await import('@/lib/learning');window.history.replaceState(null,'','/professional/lesson/runtime/play/');
 try{expect(lessonHref('lesson_one','session_one','play')).toBe('/professional/lesson/runtime/play/?lesson_id=lesson_one&session_id=session_one');expect(workspaceHref('library')).toBe('/professional/lessons/');expect(workspaceHref('create')).toBe('/professional/create/');}finally{window.history.replaceState(null,'','/');}
});

it('keeps evidence and instructor sharing opt-in and submits the explicit choice',async()=>{
 const entry={id:'enrollment',version:2,status:'learning',course,practice_complete:true,evidence_count:1,evidence_shared:false,reviews:[],lessons:[{id:'first',title:'Identify components',total_steps:3,completed_steps:3,session_id:'session'}]};const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>{if(path==='/v1/professional/enrollments')return {enrollments:[entry]};if(path.endsWith('/request-review'))return {};return base(path,body,options);});render(<ProfessionalStudio view="library"/>);await screen.findByText(/1 evidence records/);expect(request.mock.calls.some(([p])=>p.endsWith('/evidence'))).toBe(false);const sharing=screen.getByRole('checkbox',{name:/Share my course evidence/}) as HTMLInputElement;expect(sharing.checked).toBe(false);fireEvent.click(sharing);fireEvent.click(screen.getByRole('button',{name:'Request instructor review'}));await waitFor(()=>expect(request).toHaveBeenCalledWith('/v1/professional/enrollments/enrollment/request-review',{expected_version:2,share_evidence:true},expect.any(Object)));
});
it('loads the evidence journal on demand and saves notes without any AI call',async()=>{
 const entry={id:'enrollment',version:1,status:'learning',course,practice_complete:false,reviews:[],lessons:[{id:'first',title:'Identify components',total_steps:3,completed_steps:1,session_id:'session'}]};const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>{if(path==='/v1/professional/enrollments')return {enrollments:[entry]};if(path.endsWith('/evidence'))return body?{id:'evidence'}:{evidence:[]};return base(path,body,options);});render(<ProfessionalStudio view="library"/>);fireEvent.click(await screen.findByRole('button',{name:'Open work evidence journal'}));await screen.findByText('No evidence recorded yet.');fireEvent.change(screen.getByLabelText('Evidence notes'),{target:{value:'Explained the components on my worksheet'}});fireEvent.click(screen.getByRole('button',{name:'Save evidence · free'}));await waitFor(()=>expect(request).toHaveBeenCalledWith('/v1/professional/enrollments/enrollment/evidence',{lesson_id:'first',notes:'Explained the components on my worksheet'},expect.objectContaining({key:expect.any(String)})));expect(request.mock.calls.some(([p])=>p.endsWith('/plan')||p.includes('/assess'))).toBe(false);
});

it('distinguishes failed briefs from drafts and opens the matching brief or ready practice',async()=>{
 const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/requests'&&!body?{requests:[
  {id:'failed-one',goal:'A failed training attempt',trade:'Plumbing',status:'failed',has_photo:false,source_url:null,href:null},
  {id:'draft-one',goal:'An untouched draft',trade:'Plumbing',status:'draft',has_photo:false,source_url:null,href:null},
  {id:'ready-one',goal:'A ready training plan',trade:'Plumbing',status:'ready',has_photo:false,source_url:null,href:'/professional/lesson/runtime/play/?lesson_id=example&session_id=saved'}
 ]}:base(path,body,options));render(<ProfessionalStudio view="library"/>);
 await screen.findByText('A failed training attempt');expect(screen.getByText(/Attempt failed · no automatic repeat/)).toBeTruthy();expect(screen.getAllByText(/Saved · not analyzed/)).toHaveLength(1);
 expect(screen.getByRole('link',{name:'View failed brief →'}).getAttribute('href')).toBe('/professional/create/#brief-failed-one');
 expect(screen.getByRole('link',{name:'Open brief →'}).getAttribute('href')).toBe('/professional/create/#brief-draft-one');
 expect(screen.getByRole('link',{name:'Open practice plan →'}).getAttribute('href')).toBe('/professional/lesson/runtime/play/?lesson_id=example&session_id=saved');
 expect(request.mock.calls.some(([,body])=>body)).toBe(false);
});
it('provides an anchor to a saved brief without automatically starting AI',async()=>{
 const base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/requests'&&!body?{requests:[{id:'failed-one',goal:'A failed training attempt',status:'failed',has_photo:false,source_url:null,href:null}]}:base(path,body,options));render(<ProfessionalStudio/>);const title=await screen.findByRole('heading',{name:'A failed training attempt'});expect(title.closest('section')?.id).toBe('brief-failed-one');expect(request.mock.calls.some(([p])=>p.endsWith('/plan'))).toBe(false);
});

it('follows the requested brief only after its saved card has loaded',async()=>{
 const previous=Object.getOwnPropertyDescriptor(Element.prototype,'scrollIntoView'),scroll=vi.fn();Object.defineProperty(Element.prototype,'scrollIntoView',{configurable:true,value:scroll});window.history.replaceState(null,'','/professional/create/#brief-loaded-later');
 let deliver!:(value:unknown)=>void;const saved=new Promise(resolve=>deliver=resolve),base=request.getMockImplementation()!;request.mockImplementation(async(path,body,options)=>path==='/v1/professional/requests'&&!body?saved:base(path,body,options));
 try{
  render(<ProfessionalStudio/>);expect(scroll).not.toHaveBeenCalled();deliver({requests:[{id:'loaded-later',goal:'Open my saved work',status:'draft',has_photo:false,source_url:null,href:null}]});
  await screen.findByRole('heading',{name:'Open my saved work'});await waitFor(()=>expect(scroll).toHaveBeenCalledWith({block:'start'}));expect((scroll.mock.instances[0] as HTMLElement).id).toBe('brief-loaded-later');
 }finally{window.history.replaceState(null,'','/');if(previous)Object.defineProperty(Element.prototype,'scrollIntoView',previous);else delete (Element.prototype as unknown as Record<string,unknown>).scrollIntoView;}
});

const assignmentFixture=(overrides={})=>({id:'assignment_one',enrollment_id:'enrollment',learner_name:'Learner',brief:{title:'Mock rig brief',outcome:'Label every fitting on the diagram',materials:['Paper diagram','Disconnected mock fittings']},criteria:[{id:'fittings',label:'Fittings identified on the diagram',required:true,latest_decision:null},{id:'order',label:'Dry-fit order explained',required:true,latest_decision:null}],preparation:[{id:'worksheet',label:'Worksheet printed',done:true},{id:'rig',label:'Disconnected rig confirmed',done:false}],status:'practice',version:2,practice_complete:true,...overrides});
const completedEntry={id:'enrollment',version:1,status:'learning',course,practice_complete:true,reviews:[],lessons:[{id:'first',title:'Identify components',total_steps:3,completed_steps:3,session_id:'session'},{id:'second',title:'Plan supervised work',total_steps:3,completed_steps:3,session_id:'session2'}]};
function assignmentMocks(assignment:unknown){
 const base=request.getMockImplementation()!;request.mockImplementation(async(path:string,body?:unknown,options?:unknown)=>{
  if(path==='/v1/professional/assignments'&&!body)return {assignments:[assignment]};
  if(path==='/v1/professional/enrollments')return {enrollments:[completedEntry]};
  if(path==='/v1/professional/review-queue')return {enrollments:[]};
  if(path.startsWith('/v1/professional/assignments/'))return assignment;
  return base(path,body,options);});
}
it('learner completes preparation in the assignment workspace without seeing Passed',async()=>{
 assignmentMocks(assignmentFixture());render(<ProfessionalStudio view="library"/>);
 expect(await screen.findByText('Mock rig brief')).toBeTruthy();
 expect(screen.getByText(/Next: complete every preparation check/)).toBeTruthy();
 expect(screen.queryByText(/Passed/)).toBeNull();
 fireEvent.click(screen.getByRole('checkbox',{name:'Disconnected rig confirmed'}));
 fireEvent.click(screen.getByRole('button',{name:'Save preparation'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('/v1/professional/assignments/assignment_one/preparation',{expected_version:2,done:['worksheet','rig']},expect.any(Object)));
 expect(request.mock.calls.some(([path])=>path.endsWith('/assess'))).toBe(false);
});
it('learner submits only with explicit evidence sharing and completed practice',async()=>{
 assignmentMocks(assignmentFixture({preparation:[{id:'worksheet',label:'Worksheet printed',done:true},{id:'rig',label:'Disconnected rig confirmed',done:true}]}));render(<ProfessionalStudio view="library"/>);
 const submit=await screen.findByRole('button',{name:'Submit evidence for assessment'});expect((submit as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox',{name:/Share my course evidence with instructors for this assessment/}));
 expect((submit as HTMLButtonElement).disabled).toBe(false);fireEvent.click(submit);
 await waitFor(()=>expect(request).toHaveBeenCalledWith('/v1/professional/assignments/assignment_one/submit',{expected_version:2,share_evidence:true},expect.any(Object)));
 expect(screen.queryByText(/Passed/)).toBeNull();
});
it('instructor assesses criteria one by one and learners see the decision',async()=>{
 identity.account.is_admin=true;assignmentMocks(assignmentFixture({status:'submitted',preparation:[{id:'worksheet',label:'Worksheet printed',done:true},{id:'rig',label:'Disconnected rig confirmed',done:true}]}));
 try{
  render(<ProfessionalStudio view="instructor"/>);
  expect(await screen.findByRole('form',{name:'Create assignment'})).toBeTruthy();
  fireEvent.change((await screen.findAllByLabelText('Criterion feedback'))[0],{target:{value:'Label the stop valve too.'}});
  fireEvent.click(screen.getAllByRole('button',{name:'Request changes'})[0]);
  await waitFor(()=>expect(request).toHaveBeenCalledWith('/v1/professional/assignments/assignment_one/assess',{criterion_id:'fittings',decision:'changes_requested',notes:'Label the stop valve too.',expected_version:2},expect.any(Object)));
 }finally{identity.account.is_admin=false;}
});
it('instructor sees submitted evidence beside each criterion before deciding',async()=>{
 identity.account.is_admin=true;
 const base=request.getMockImplementation()!;request.mockImplementation(async(path:string,body?:unknown,options?:unknown)=>{
  if(path==='/v1/professional/enrollments/enrollment/evidence')return {evidence:[{id:'ev1',lesson_id:'first',criterion_id:'fittings',notes:'Labelled diagram worksheet',has_photo:true,status:'ready',created_at:Date.now()},{id:'ev2',lesson_id:'first',criterion_id:null,notes:'General practice notes',has_photo:false,status:'ready',created_at:Date.now()}]};
  if(path==='/v1/professional/assignments'&&!body)return {assignments:[assignmentFixture({status:'submitted',preparation:[{id:'worksheet',label:'Worksheet printed',done:true},{id:'rig',label:'Disconnected rig confirmed',done:true}]})]};
  if(path==='/v1/professional/review-queue')return {enrollments:[]};
  return base(path,body,options);});
 try{
  render(<ProfessionalStudio view="instructor"/>);
  expect(await screen.findByText('Labelled diagram worksheet')).toBeTruthy();
  expect(await screen.findByText('General practice notes')).toBeTruthy();
  expect(screen.getAllByRole('button',{name:'Approve criterion'}).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button',{name:'View photo'}));
  await waitFor(()=>expect(request.mock.calls.some(([path])=>path==='/v1/professional/evidence/ev1/photo')).toBe(true));
 }finally{identity.account.is_admin=false;}
});
it('changes-requested assignments show instructor feedback and a resubmit action',async()=>{
 assignmentMocks(assignmentFixture({status:'changes_requested',criteria:[{id:'fittings',label:'Fittings identified on the diagram',required:true,latest_decision:{decision:'changes_requested',notes:'Label the stop valve too.'}},{id:'order',label:'Dry-fit order explained',required:true,latest_decision:null}]}));render(<ProfessionalStudio view="library"/>);
 expect(await screen.findByText('Label the stop valve too.')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Resubmit for assessment'})).toBeTruthy();
 expect(screen.queryByText(/Passed/)).toBeNull();
});
