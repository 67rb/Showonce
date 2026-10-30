/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// Sites dispatch owns sign-in and supplies these identity headers. They must not
// be populated from application JSON, URL parameters or local browser storage.
export async function requestUser(request,checkExpected=true){
 const subject=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 const expected=request.headers.get('x-showonce-account');
 if(!subject||subject.length>500||!email||email.length>320||!/^\S+@\S+\.\S+$/.test(email)||/[\u0000-\u001f]/.test(subject+email)){if(checkExpected&&expected)throw new AppError('account_changed','Your signed-in account changed. Refresh your account before continuing.',409);return null;}
 let name=null;
 if(request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')try{name=decodeURIComponent(request.headers.get('oai-authenticated-user-full-name')||'');}catch{}
 const user={id:'account_'+await digest(subject),email,display_name:clean(name||email).slice(0,160)};
 if(checkExpected&&expected&&expected!==user.id)throw new AppError('account_changed','Your signed-in account changed. Refresh your account before continuing.',409);
 return user;
}
function accountRequired(user){if(!user)throw new AppError('sign_in_required','Sign in to open your account library.',401);return user;}
function isAdmin(env,user){
 if(!user)return false;
 let emails;try{emails=JSON.parse(env.ADMIN_EMAILS||'[]');}catch{return false;}
 return Array.isArray(emails)&&emails.some(email=>typeof email==='string'&&email.trim().toLowerCase()===user.email);
}
function adminRequired(env,user){accountRequired(user);if(!isAdmin(env,user))throw new AppError('admin_required','This area is for the catalogue team.',403);return user;}
async function ensureAccount(env,user){
 accountRequired(user);const now=Date.now();
 await env.DB.prepare('INSERT INTO learner_accounts(id,email,display_name,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,updated_at=excluded.updated_at').bind(user.id,user.email,user.display_name,now,now).run();
 return user;
}
export async function authorizeLesson(env,id,user,token='',allowExisting=false){
 const row=await env.DB.prepare('SELECT owner_id FROM ai_lessons WHERE id=?').bind(id).first();
 if(row?.owner_id&&row.owner_id!==user?.id)throw new AppError('lesson_not_found','This lesson is not available to this account.',404);
 await catalogueVisible(env,id,user,token,allowExisting);
 return row?.owner_id||null;
}
function accountProfile(env,user){return {authenticated:!!user,user,is_admin:isAdmin(env,user),sign_in_url:'/signin-with-chatgpt?return_to=%2F',sign_up_url:'/signin-with-chatgpt?return_to=%2F',sign_out_url:'/signout-with-chatgpt?return_to=%2F',recovery_url:'/signin-with-chatgpt?return_to=%2F',identity_provider:'chatgpt'};}
export async function accountLibrary(env,user,cursor,origin,filter='all'){
 accountRequired(user);let before=Number.MAX_SAFE_INTEGER,beforeID='~';
 if(!['all','active','completed'].includes(filter))throw new AppError('invalid_library_filter','Choose All practices, In progress or Completed.');
 if(cursor){try{if(cursor.length>500)throw 0;const parsed=JSON.parse(atob(cursor));if(!Array.isArray(parsed)||parsed.length!==2||!Number.isSafeInteger(parsed[0])||parsed[0]<0||typeof parsed[1]!=='string'||!/^[A-Za-z0-9_-]{1,200}$/.test(parsed[1]))throw 0;[before,beforeID]=parsed;}catch{throw new AppError('invalid_cursor','Reload your library to continue.');}}
 const rows=await env.DB.prepare("SELECT * FROM practice_sessions WHERE owner_id=? AND (created_at<? OR (created_at=? AND id<?)) AND (?='all' OR (?='completed' AND current_index>=total_steps) OR (?='active' AND current_index<total_steps)) ORDER BY created_at DESC,id DESC LIMIT 26").bind(user.id,before,before,beforeID,filter,filter,filter).all();
 const page=rows.results.slice(0,25),entries=[];
 for(const row of page){const lesson=await getLesson(env,row.lesson_id,origin),total=lesson.steps.length,completed=Math.min(row.current_index,total);entries.push({id:row.id,lesson_id:row.lesson_id,title:String(lesson.title).slice(0,400),category:String(lesson.category||'practice').slice(0,100),total_steps:total,completed_steps:completed,status:completed===total?'completed':'active',created_at:timestamp(row.created_at),updated_at:timestamp(row.updated_at),account_owned:true});}
 const counts=await env.DB.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN current_index>=total_steps THEN 1 ELSE 0 END),0) AS completed FROM practice_sessions WHERE owner_id=?').bind(user.id).first();
 const last=page.at(-1);return {entries,counts:{all:counts.total,completed:counts.completed,active:counts.total-counts.completed},next_cursor:rows.results.length>25?btoa(JSON.stringify([last.created_at,last.id])):null};
}
export async function attachPractice(env,user,body,origin){
 await ensureAccount(env,accountRequired(user));
 if(typeof body.session_id!=='string'||typeof body.access_token!=='string'||!body.access_token)throw new AppError('invalid_session_access','Choose a practice with valid private access.',401);
 const row=await env.DB.prepare('SELECT * FROM practice_sessions WHERE id=?').bind(body.session_id).first();
 if(!row||row.owner_id&&row.owner_id!==user.id||!row.owner_id&&row.token_hash!==await digest(body.access_token))throw new AppError('invalid_session_access','This practice is not available to this account.',401);
 await authorizeLesson(env,row.lesson_id,user,body.access_token,true);const lesson=await getLesson(env,row.lesson_id,origin);
 await env.DB.prepare('UPDATE practice_sessions SET owner_id=?,total_steps=? WHERE id=? AND owner_id IS NULL AND token_hash=?').bind(user.id,lesson.steps.length,row.id,await digest(body.access_token)).run();
 const owned=await getSession(env,row.id);if(owned.owner_id!==user.id)throw new AppError('invalid_session_access','This practice is not available to this account.',401);
 return {progress:await sessionProgress(env,owned,origin),account_owned:true};
}
export async function routeAccounts(request,env,url){
 const path=url.pathname.replace(/\/$/,''),method=request.method;
 if(path!=='/api/account'&&path!=='/v1/library'&&path!=='/v1/library/attach')return null;
 const user=await requestUser(request,path!=='/api/account');
 if(path==='/api/account'&&method==='GET'){if(user)await ensureAccount(env,user);return json(accountProfile(env,user));}
 if(method!=='GET'&&request.headers.get('origin')!==url.origin)throw new AppError('origin_denied','Open this action from the Show Once app.',403);
 accountRequired(user);
 if(path==='/v1/library'&&method==='GET')return json(await accountLibrary(env,user,url.searchParams.get('cursor'),url.origin,url.searchParams.get('filter')||'all'));
 if(path==='/v1/library/attach'&&method==='POST')return json(await attachPractice(env,user,await bodyJSON(request),url.origin));
 throw new AppError('route_not_found','This action is unavailable.',404);
}
