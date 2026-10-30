/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
async function ingestLesson(env,body,origin,user=null){
    if(body.save_to_account!==undefined&&typeof body.save_to_account!=='boolean')throw new AppError('invalid_account_mode','Choose whether to save to your signed-in account.');
    const owner=body.save_to_account===true?await ensureAccount(env,accountRequired(user)):null;
    if(body.processing_mode!==undefined&&!['ai','structured_text'].includes(body.processing_mode))throw new AppError('invalid_processing_mode','Choose AI processing or free numbered steps.');
    if(body.source_text!==undefined&&typeof body.source_text!=='string'||body.source_url!==undefined&&body.source_url!==null&&typeof body.source_url!=='string')throw new AppError('invalid_source','Provide tutorial instructions or an HTTPS source link as text.');
    if(body.learning_mode!==undefined&&!['auto','visual'].includes(body.learning_mode))throw new AppError('invalid_learning_mode','Choose automatic or video observation learning.');
    if(body.learning_goal!==undefined&&(typeof body.learning_goal!=='string'||body.learning_goal.length>300))throw new AppError('invalid_learning_goal','Describe what you want to learn in up to 300 characters.');
    if(body.example_id!==undefined&&(typeof body.example_id!=='string'||!body.example_id||body.example_id.length>200))throw new AppError('example_not_found','Choose an available example.');
    if(body.example_id){const e=await publishedExample(env,body.example_id,origin);if(!e)throw new AppError('example_not_found','Choose an available example.');return e;}
    const pasted=typeof body.source_text==='string'?body.source_text.trim():'';
    if(pasted.length>24000)throw new AppError('source_too_long','Paste up to 24,000 characters of relevant instructions.');
    let source;
    if(pasted){if(body.processing_mode!=='structured_text'&&pasted.length<100)throw new AppError('insufficient_source','Paste at least a few complete instructions (100 characters).');let reference=null;if(body.source_url){try{if(typeof body.source_url!=='string'||body.source_url.length>2048)throw 0;const u=new URL(body.source_url);if(u.protocol!=='https:'||u.username||u.password)throw 0;reference=u.href;}catch{throw new AppError('invalid_link','Use an HTTPS reference link, or leave it blank.');}}source={text:pasted,source_url:reference,origin:'user_provided_text'};}
    else {if(body.processing_mode==='structured_text')throw new AppError('numbered_steps_required','Paste 2–18 numbered steps to use free self-guided practice.');if(!body.source_url)throw new AppError('source_required','Add a tutorial link or paste its instructions.');try{source=await resolveTutorial(env,body.source_url,fetch,{visualOnly:body.learning_mode==='visual'});}catch(error){if(error.code!=='source_insufficient_content'||!socialExtractionEnabled(env))throw error;source=await resolveVideoDemonstration(env,body.source_url);}if(source.status==='source_processing')return source;}
    source={...source,learning_goal:body.learning_goal?.trim()||null};
    let lesson;
    try{lesson=body.processing_mode==='structured_text'?await numberedLesson(source):await makeLesson(env,source);}
    catch(error){
     if(error.code!=='insufficient_source'||!socialExtractionEnabled(env)||!['social_transcript','social_post_text'].includes(source.origin))throw error;
     try{source=await resolveVideoDemonstration(env,body.source_url);}catch(visualError){if(visualError.code==='source_not_video')throw error;throw visualError;}
     if(source.status==='source_processing')return source;
     lesson=await makeLesson(env,{...source,learning_goal:body.learning_goal?.trim()||null});
    }
    await env.DB.prepare('INSERT INTO ai_lessons(id,content,created_at,owner_id) VALUES(?,?,?,?)').bind(lesson.id,JSON.stringify(lesson),Date.now(),owner?.id||null).run();return lesson;
}
const EXAMPLES=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(ASSETS['/examples.json'].data),c=>c.charCodeAt(0))));
const lessonResponse=data=>json(data,data.status==='source_processing'?202:201);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function example(id,origin){const lesson=structuredClone(EXAMPLES.find(l=>l.id===id));if(!lesson)return null;if(lesson.source_url?.startsWith('/'))lesson.source_url=origin+lesson.source_url;for(const s of lesson.steps)if(s.source_reference?.url?.startsWith('/'))s.source_reference.url=origin+s.source_reference.url;return lesson;}
async function getLesson(env,id,origin){const builtin=PRO_CATALOGUE.lessons.find(item=>item.id===id)||example(id,origin);if(builtin)return builtin;const row=await env.DB.prepare('SELECT content FROM ai_lessons WHERE id=?').bind(id).first();if(!row)throw new AppError('lesson_not_found','That lesson is unavailable. Create it again.',404);const lesson=JSON.parse(row.content);if(lesson.source_url?.startsWith('/'))lesson.source_url=origin+lesson.source_url;for(const step of lesson.steps)if(step.source_reference?.url?.startsWith('/'))step.source_reference.url=origin+step.source_reference.url;return lesson;}
async function bodyJSON(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AppError('invalid_body','Use JSON requests.',415);
 if(Number(request.headers.get('content-length'))>7100000)throw new AppError('body_too_large','Request exceeds the 7.1 MB limit.',413);
 const reader=request.body?.getReader();if(!reader)throw new AppError('invalid_body','Request body is required.');let size=0,all=[];
 while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>7100000){await reader.cancel();throw new AppError('body_too_large','Request exceeds the upload limit.',413);}all.push(value);}
 const data=new Uint8Array(size);let o=0;for(const p of all){data.set(p,o);o+=p.length;}try{const b=JSON.parse(new TextDecoder().decode(data));if(!b||Array.isArray(b)||typeof b!=='object')throw 0;return b;}catch{throw new AppError('invalid_body','Provide a JSON object.');}
}
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 try{
  const professional=await routeProfessional(request,env,url);if(professional)return professional;
  const account=await routeAccounts(request,env,url);if(account)return account;
  if(request.headers.has('x-showonce-account'))await requestUser(request);
  const team=await routeTeam(request,env,url);if(team)return team;
  const illustration=await routeIllustration(request,env,url);if(illustration)return illustration;
  const master=await routeMaster(request,env,url);if(master)return master;
  if(path==='/api/config'){
   const lessons=await publishedLessons(env,url.origin);return json({schema_version:VERSION,lesson:lessons[0]||null,examples:lessons.map(l=>({id:l.id,title:l.title,category:l.category,steps:l.steps.length})),session_api:'v1',photo_storage:'private_session',provider:'meta',is_mock:false,hosted_ai:true,source_limits:{download_bytes:MAX_SOURCE_BYTES,extracted_text_characters:MAX_SOURCE_TEXT},source_processing:{provider:'supadata',enabled:socialExtractionEnabled(env),free_only:true,visual_demonstrations:true},ai_available:!!env.MODEL_API_KEY,token:'same-origin-public-trial',budget:env.DB?await budgetSummary(env.DB):null});
  }
  if(path.startsWith('/examples/')){
   const e=EXAMPLES.find(l=>l.source_url===path);if(e){await authorizeLesson(env,e.id,await requestUser(request),(request.headers.get('authorization')||'').replace(/^Bearer /,''),true);return new Response(e.title+'\n\n'+e.source_text,{headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'}});}
  }
  if(path.startsWith('/api/')){
   if(request.method!=='POST')throw new AppError('method_not_allowed','Use POST.',405);
   if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw new AppError('origin_denied','Open this action from the Show Once app.',403);
   const body=await bodyJSON(request);
   if(path==='/api/ingest'){
    return lessonResponse(await ingestLesson(env,body,url.origin,await requestUser(request)));
   }
   if(path==='/api/assess'){
    return json(await liveAssessment(env,body,(request.headers.get('authorization')||'').replace(/^Bearer /,''),url.origin,assessPhoto,await requestUser(request)));
   }
   if(path==='/api/budget')return json(await budgetSummary(env.DB));
   if(path==='/api/live/stop')return json({status:'stopped'});
   throw new AppError('route_not_found','This action is not available.',404);
  }
  const aliases={'/courses':'/professional/lessons/','/courses/':'/professional/lessons/','/instructor':'/professional/instructor/','/instructor/':'/professional/instructor/'};
  if(aliases[path]&&['GET','HEAD'].includes(request.method))return Response.redirect(url.origin+aliases[path]+url.search,302);
  const frontendPath='/frontend'+(path==='/'?'/index.html':path),frontendAsset=ASSETS[frontendPath]||ASSETS[frontendPath+(path.endsWith('/')?'':'/')+'index.html'];
  const earlier=path==='/studio'||path==='/studio/';
  const professionalPage=path==='/professional-legacy/';
  const asset=professionalPage?ASSETS['/professional.html']:earlier?ASSETS['/index.html']:frontendAsset||ASSETS[path==='/'?'/index.html':path];if(!asset)throw new AppError('not_found','Page not found.',404);
  if(!['GET','HEAD'].includes(request.method))throw new AppError('method_not_allowed','Use GET for app pages.',405);
  const nextFrontend=!!frontendAsset&&!earlier&&!professionalPage;
  const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':nextFrontend?(path.startsWith('/_next/static/')?'public, max-age=31536000, immutable':'no-cache'):'public, max-age=60','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(self), microphone=(), geolocation=()','Content-Security-Policy':nextFrontend?"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"}});
 }catch(error){const status=error instanceof AppError?error.status:503;return json({error:{code:error instanceof AppError?error.code:'service_unavailable',message:error instanceof AppError?error.message:'The learning service is temporarily unavailable. Try an example or retry shortly.',retryable:status>=500||status===429}},status);}
}};
