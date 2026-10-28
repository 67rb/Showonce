"use strict";
const $ = (selector) => document.querySelector(selector);
const h = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const titles = ["Make the first fold", "Mark your reference", "Bring the left tip across", "Fold the right side", "Lower the front flap", "Fold the back flap", "Open your paper cup"];
const state = {screen:"entry", lesson:null, token:"", index:0, photo:null, feedback:null, error:null, completed:new Set(), mode:"photo", busy:false, running:false, frame:null, frameMeta:"", preview:false, isMock:true};
let frameTimer, pollTimer, liveGeneration = 0, frameCount = 0, uploadGeneration = 0, actionGeneration = 0;
const announce = (message) => { $("#announcer").textContent = message; };
const step = () => state.lesson.steps[state.index];
const sourceLink = () => '<a class="source-link" href="https://origami.me/cup/" target="_blank" rel="noopener noreferrer">View original tutorial <span aria-hidden="true">↗</span></a>';
const icon = (name) => {
  const paths = {link:'<path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l2-2"/>',camera:'<path d="M8 6l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="4"/>',arrow:'<path d="M4 12h16M14 6l6 6-6 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',spark:'<path d="M12 2l2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z"/>'};
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.spark}</svg>`;
};
const cupArt = () => `<div class="illustration" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><span class="art-spark spark-one">✳</span><span class="art-spark spark-two">+</span><svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg"><ellipse cx="172" cy="246" rx="92" ry="13" fill="#365848" opacity=".12"/><path d="M81 92L261 76L230 226L112 238Z" fill="#e7ba65"/><path d="M81 92L177 158L112 238Z" fill="#f6d99a"/><path d="M261 76L177 158L230 226Z" fill="#d4a34b"/><path d="M112 238L177 158L230 226Z" fill="#edc77f"/><path d="M81 92L177 158L261 76M112 238L177 158L230 226" fill="none" stroke="#a67732" stroke-opacity=".45" stroke-width="1.2"/><ellipse cx="171" cy="84" rx="90" ry="25" transform="rotate(-5 171 84)" fill="#ad7e36"/><path d="M83 91Q167 32 259 76Q179 55 83 91" fill="#fff2d2"/><path d="M85 93L113 236L229 225" fill="none" stroke="#fff1cc" stroke-width="2" opacity=".65"/></svg><div class="art-label"><span class="tiny-dot"></span> A square of paper, reimagined.</div></div>`;
function foldArt(index) {
  const shapes = [
    '<path d="M104 247L280 67L456 247Z" fill="#f3d69c"/><path d="M280 67L456 247L280 247Z" fill="#e9bd71"/><path d="M280 67V247" stroke="#b48742" stroke-dasharray="5 6" opacity=".65"/>',
    '<path d="M104 247L280 67L456 247Z" fill="#f3d69c"/><path d="M105 247L280 180L456 247Z" fill="#ebc37c"/><path d="M418 208L440 220" stroke="#466852" stroke-width="3"/><circle cx="434" cy="223" r="18" fill="none" stroke="#466852" stroke-width="1.5" stroke-dasharray="3 5"/>',
    '<path d="M104 247L280 67L456 247Z" fill="#f3d69c"/><path d="M104 247L220 129L415 205Z" fill="#e6b567"/><path d="M104 247L415 205L280 247Z" fill="#f9e4b6"/>',
    '<path d="M130 247L105 153L280 67L456 153L430 247Z" fill="#f2d395"/><path d="M105 153L310 160L130 247Z" fill="#e4b56b"/><path d="M456 153L230 160L430 247Z" fill="#f8dfac"/><path d="M230 160L310 160" stroke="#bd8f48" stroke-width="1.5"/>',
    '<path d="M130 247L105 153L280 67L456 153L430 247Z" fill="#efca87"/><path d="M105 153L310 160L130 247Z" fill="#e3b369"/><path d="M456 153L230 160L430 247Z" fill="#f8dfac"/><path d="M208 153L352 153L280 220Z" fill="#fff0cb"/>',
    '<path d="M130 247L105 153L280 110L456 153L430 247Z" fill="#f0cc89"/><path d="M105 153L310 160L130 247Z" fill="#f9e1ad"/><path d="M456 153L230 160L430 247Z" fill="#dfaf60"/><path d="M208 153L352 153L280 220Z" fill="#fff0cb"/><path d="M208 153L280 110L352 153" fill="#c99b51"/>',
    '<path d="M132 139L429 121L397 252L166 267Z" fill="#efcb88"/><path d="M132 139L282 210L166 267Z" fill="#f8dfad"/><path d="M429 121L282 210L397 252Z" fill="#dba95b"/><ellipse cx="280" cy="131" rx="149" ry="33" transform="rotate(-4 280 131)" fill="#b78b44"/><path d="M134 137Q280 77 427 121Q280 104 134 137" fill="#fff1cf"/>'
  ];
  return `<div class="fold-stage" role="img" aria-label="Authored illustration of ${h(titles[index])}; consult the original source for precise diagrams."><span class="guide-label">THE SHAPE TO AIM FOR</span><svg viewBox="0 0 560 330" aria-hidden="true"><ellipse cx="282" cy="276" rx="162" ry="10" fill="#384f3e" opacity=".08"/>${shapes[index]}</svg><span class="guide-number" aria-hidden="true">${String(index+1).padStart(2,"0")}</span></div>`;
}

async function api(path, body) {
  if (window.ShowOncePublic) return window.ShowOncePublic.request(path, body);
  const response = await fetch(path, {method:"POST", headers:{"Content-Type":"application/json","X-Demo-Token":state.token}, body:JSON.stringify(body)});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error?.message || "The local demonstration could not complete this request.");
  return value;
}
function errorBox(message, title="Let’s try that again") {
  return `<div class="feedback error error-inline" role="alert"><div class="feedback-heading"><span aria-hidden="true">!</span>${h(title)}</div><p>${h(message)}</p></div>`;
}
function clearPhoto() {
  uploadGeneration++;
  if (state.photo?.preview?.startsWith("blob:")) URL.revokeObjectURL(state.photo.preview);
  state.photo=null; state.feedback=null; state.error=null;
}
function renderNav() {
  $("#lesson-nav").innerHTML = state.screen === "entry" || state.screen === "processing" ? "" : `<div class="eyebrow">PAPER CUP · 7 STEPS</div>${state.lesson.steps.map((s,i)=>`<button class="nav-step ${state.completed.has(s.id)?"done":""}" data-step="${i}" ${i===state.index&&state.screen==="step"?'aria-current="step"':""} aria-label="Preview step ${i+1}: ${h(titles[i])}"><span class="step-number" aria-hidden="true">${state.completed.has(s.id)?"✓":String(i+1).padStart(2,"0")}</span><span>${h(titles[i])}</span></button>`).join("")}<p class="caption spacer">Step navigation previews designs.<br>Saved progress belongs to the session backend.</p>`;
  document.querySelectorAll("[data-step]").forEach(button=>button.addEventListener("click", async()=>{
    await stopLive(false); actionGeneration++; clearPhoto(); state.index=Number(button.dataset.step); state.screen="step"; state.preview=true; state.busy=false; render();
  }));
}
function entry() {
  return `<div class="entry-heading"><div class="page-title"><div class="eyebrow"><span class="eyebrow-line"></span> YOUR PRACTICE SPACE</div><h1>What will you<br><em>make</em> today?</h1><p class="subhead">A tutorial is just the beginning. Turn it into something<br class="desktop-break"> you can do, with guidance at every step.</p></div><div class="entry-stamp" aria-hidden="true"><span>LEARN BY</span><span class="stamp-flower">✳</span><span>DOING</span></div></div>
    <div class="entry-grid"><section class="card card-content start-card"><div class="card-kicker"><span class="section-number">01</span> A LITTLE INSPIRATION</div><h2>Start with a tutorial.</h2><p class="card-intro">Found something you’d like to try? Bring the link.</p><form id="tutorial-form" class="entry-form"><label for="tutorial-url">Your tutorial link</label><div class="url-field">${icon("link")}<input id="tutorial-url" name="source_url" type="url" required maxlength="2048" value="https://origami.me/cup/" aria-describedby="url-help" ${state.error?'aria-invalid="true"':""}></div><p id="url-help" class="field-help">Currently supporting the Origami.me paper cup tutorial.<br>More sources will need a reviewed extraction adapter.</p><button class="button primary wide" type="submit">Create my practice lesson <span class="button-arrow">${icon("arrow")}</span></button>${state.error?errorBox(state.error):""}</form><div class="form-footer"><span>${icon("spark")} 7 small checkpoints</span><span>${icon("clock")} Your own pace</span></div></section><section class="card feature-preview"><div class="feature-topline"><span class="tag">A GOOD PLACE TO START</span><span class="feature-category">ORIGAMI</span></div>${cupArt()}<div class="feature-copy"><div><span class="eyebrow">YOUR FIRST PRACTICE</span><h2>The humble paper cup.</h2><p>One square sheet. Seven folds. Something made by you.</p></div><span class="lesson-corner" aria-hidden="true">↗</span></div></section></div>
    <div class="workflow-strip" aria-label="How practice works"><div><span class="workflow-number">1</span><p><strong>Bring a tutorial</strong><small>We find the practical steps.</small></p></div><span class="workflow-connector" aria-hidden="true"></span><div><span class="workflow-number">2</span><p><strong>Make it your own</strong><small>Try one small step at a time.</small></p></div><span class="workflow-connector" aria-hidden="true"></span><div><span class="workflow-number">3</span><p><strong>See what to improve</strong><small>Get feedback on what’s visible.</small></p></div></div><p class="entry-note"><span aria-hidden="true">◈</span><span>This local studio uses an authored lesson and synthetic samples. The provider banner shows whether feedback is from fixtures or Meta.</span></p>`;
}
function processing() {
  return `<section class="card loading-state" aria-busy="true"><span class="spinner" aria-hidden="true"></span><div class="eyebrow">A LITTLE PREPARATION</div><h1>Getting your practice ready</h1><p>Reading the supported fixture and checking the lesson structure.</p><div class="loading-stages"><p>✓ Checking the tutorial link</p><p>✓ Finding the ordered instructions</p><p>◌ Preparing visible checkpoints</p></div>${state.preview?'<p>Component preview. Choose another state to continue.</p><button id="return-entry" class="button secondary spacer">Back to tutorial entry</button>':""}</section>`;
}
function overview() {
  return `<div class="page-title"><div class="eyebrow">YOUR LESSON IS READY</div><h1>Fold a paper cup</h1><p class="subhead">A traditional fold. Seven small moments of practice.<br>Take your time, and check your work as you go.</p></div><div class="practice-grid"><section class="card card-content"><div class="split"><h2>Your path, step by step</h2><span class="tag">7 CHECKPOINTS</span></div><ol class="overview-list">${state.lesson.steps.map((s,i)=>`<li><span class="step-number" aria-hidden="true">${String(i+1).padStart(2,"0")}</span><div><strong>${h(titles[i])}</strong><p>${h(s.instructions)}</p></div></li>`).join("")}</ol></section><div class="stack"><section class="card feature-preview">${cupArt()}<div class="feature-copy"><div class="cluster"><span class="tag">ORIGAMI</span><span class="tag">BEGINNER</span></div><h2>Start with something simple.</h2><p>Source: Peter Saydak · Origami.me<br>Traditional design · Beginner / Level 1</p></div></section><section class="card card-content"><h3>Bring to the table</h3><ul class="plain-list">${state.lesson.materials.map(m=>`<li>${h(m)}</li>`).join("")}</ul><div class="soft-divider"></div>${sourceLink()}<p class="caption spacer">Source diagrams aren’t bundled. Keep the original tutorial handy for the finer details.</p><button id="begin" class="button primary wide spacer">Let’s make it <span aria-hidden="true">→</span></button></section></div></div>`;
}
function feedbackHTML(value, live=false) {
  const labels={pass:["✓","That’s the shape we’re looking for"],retry:["↺","One small adjustment"],uncertain:["?","Let’s get a clearer look"]};
  const [icon,title]=labels[value.result];
  return `<section id="assessment-feedback" class="feedback ${h(value.result)}" tabindex="-1" role="status" aria-live="polite"><div class="feedback-heading"><span aria-hidden="true">${icon}</span>${title}</div><p>${h(value.feedback)}</p>${value.corrections.length?`<ul>${value.corrections.map(c=>`<li>${h(c)}</li>`).join("")}</ul>`:""}${value.requested_evidence.length?`<ul>${value.requested_evidence.map(c=>`<li>${h(c)}</li>`).join("")}</ul>`:""}<details><summary>Evidence and assessment details</summary>${value.criteria.map(c=>`<div class="check-evidence"><strong>${h(c.criterion)} · ${h(c.status)}</strong><br>${h(c.evidence)}</div>`).join("")}<p class="caption">${h(value.provider)} / ${h(value.model)}<br>${h(value.latency_ms)} ms · ${value.is_mock?"Mock annotation, no model inference":"Provider inference"}<br>${h(value.safety_notice)}</p></details>${value.result==="pass"&&!live?`<button id="next-step" class="button primary wide spacer">${state.index===6?"Finish practice":"Continue to step "+(state.index+2)} <span aria-hidden="true">→</span></button><p class="caption spacer">Local demo navigation. The production session backend decides saved progress.</p>`:""}${live&&value.result==="pass"?'<p class="caption spacer">Frame feedback does not advance the step. Return to a photo checkpoint to continue the demo.</p>':""}</section>`;
}
function photoPanel() {
  return `<section class="card card-content" aria-labelledby="capture-title" ${state.busy?'aria-busy="true"':""}><div class="split"><h2 id="capture-title">Make it. Then show it.</h2><span class="tag capture-tag"><span class="tiny-dot"></span> PHOTO CHECKPOINT</span></div><p class="caption spacer">Give the fold a go, then add a photo. A clear view makes the feedback more useful.</p><input class="sr-only" id="photo-file" type="file" accept="image/png,image/jpeg,image/webp" tabindex="-1" aria-label="Choose a photo of your work">${state.photo?`<div class="photo-preview"><img src="${h(state.photo.preview)}" alt="${h(state.photo.label)}"><div class="preview-actions"><span>${h(state.photo.label)}</span><button id="replace-photo" class="button quiet small" ${state.busy?"disabled":""}>Replace</button></div></div>`:`<button id="upload-zone" class="upload-zone" type="button" aria-describedby="upload-help"><span class="upload-icon" aria-hidden="true">${icon("camera")}</span><strong>Add a photo of your work</strong><small>Choose a file, or drop it here</small></button>`}<p id="upload-help" class="caption">PNG, JPEG or WebP · up to 5 MiB · 16 megapixels</p>${state.busy?'<div class="loading-feedback" role="status"><span class="spinner" aria-hidden="true"></span>Checking the visible details…</div>':""}<button id="check-photo" class="button primary wide spacer" ${!state.photo||state.busy?"disabled":""}>${state.busy?"Checking your photo…":"Check my work"}<span aria-hidden="true">↗</span></button>${state.error?errorBox(state.error):""}${state.feedback?feedbackHTML(state.feedback):""}<details class="fixture-picker"><summary>No photo handy? Try a sample</summary><p class="caption spacer">${state.isMock?"Synthetic test fixtures. Mock feedback comes from annotations, not pixel analysis. Other photos return uncertain.":"Synthetic sample diagrams exercise the real vision connection. Model feedback may disagree with labels; these samples do not establish real-photo accuracy."}</p><div class="fixture-buttons">${["correct",...(state.index===0?["mistake","blurred","unrelated","hidden"]:[])].map(c=>`<button data-fixture="${c}" ${state.busy?"disabled":""}>${{correct:"Correct fold",mistake:"Wrong fold",blurred:"Blurry",unrelated:"Unrelated",hidden:"Obstructed"}[c]}</button>`).join("")}</div></details></section>`;
}
function livePanel() {
  return `<section class="card card-content"><div class="split"><h2>Practice in the moment.</h2><span class="tag">SAMPLED FRAMES</span></div><p class="caption spacer">A sequence of synthetic frames stands in for Steven’s camera controls.</p><div class="camera-view">${state.frame?`<img src="${h(state.frame)}" alt="Current synthetic frame for step ${state.index+1}">`:'<div class="camera-placeholder"><span aria-hidden="true">⌗</span>Your practice space<br>Start the sample sequence when you’re ready.</div>'}<span class="camera-label">${state.running?"● SAMPLE SEQUENCE":"SAMPLE CAMERA LAYOUT"}</span></div><div class="cluster spacer"><button id="start-live" class="button primary" ${state.running?"disabled":""}>Start feedback <span aria-hidden="true">▶</span></button><button id="stop-live" class="button secondary" ${!state.running?"disabled":""}>Stop <span aria-hidden="true">■</span></button></div><p class="frame-meta" role="status">${h(state.frameMeta||(state.isMock?"One frame every 1.8 seconds · one request at a time · latest pending frame wins":"Sample frames every 3.2 seconds · asynchronous Meta guidance · one request at a time"))}</p>${state.error?errorBox(state.error):""}${state.feedback?feedbackHTML(state.feedback,true):""}<div class="limit-note">No step advances from frame feedback. A changed step or Stop discards pending feedback; an already sent provider request may still finish.</div></section>`;
}
function practice() {
  const current=step();
  return `<div class="title-row"><div><div class="step-meta"><span class="lesson-dot"></span> PAPER CUP <span class="meta-divider" aria-hidden="true">/</span> STEP ${String(state.index+1).padStart(2,"0")} OF 07</div><h1 class="step-title">${h(titles[state.index])}</h1></div><div class="mode-switch" role="group" aria-label="Learning mode"><button id="photo-mode" aria-pressed="${state.mode==="photo"}">${icon("camera")} Photo checkpoints</button><button id="live-mode" aria-pressed="${state.mode==="live"}"><span class="live-ring" aria-hidden="true"></span> Live feedback</button></div></div><progress class="sr-only" max="7" value="${state.index}" aria-label="${state.index} of 7 steps reached"></progress><div class="checkpoint-rail" aria-hidden="true">${state.lesson.steps.map((s,i)=>`<span class="${i<state.index?"reached":i===state.index?"current":""}"></span>`).join("")}</div><div class="practice-grid"><section class="card instruction-card"><div class="reference-art">${foldArt(state.index)}</div><p class="reference-caption"><span class="caption-dot"></span> ILLUSTRATIVE GUIDE · NOT A SOURCE DIAGRAM</p><div class="card-content"><div class="eyebrow">LET’S TRY IT</div><p class="instruction">${h(current.instructions)}</p><div class="soft-divider"></div><h3>Look for these details</h3>${current.assessment_criteria.map(c=>`<p class="check-row"><span class="check-icon" aria-hidden="true">✓</span>${h(c)}</p>`).join("")}<div class="limit-note">${current.visual_limits.map(h).join(" ")}</div><div class="source-row">${sourceLink()}<span>Step ${state.index+1}</span></div><p class="caption spacer">Expected: ${h(current.expected_visual_result)}</p></div></section>${state.mode==="photo"?photoPanel():livePanel()}</div>`;
}
function completion() {
  return `<section class="completion"><div class="completion-art" aria-hidden="true">✳</div><div class="eyebrow">ONE SMALL THING, MADE BY YOU</div><h1 class="spacer">Look what a little<br>practice can do.</h1><p class="subhead">You’ve walked through the paper cup practice.<br>Keep making. The next fold gets a little more familiar.</p><div class="completion-stats"><div><strong>7</strong><small>practice checkpoints</small></div><div><strong>Origami</strong><small>your learning category</small></div></div><p class="caption">${state.preview?"Completion screen preview.":"Local photo journey completed."} This does not verify real-world skill or model accuracy.<br>No saved production progress is changed.</p><div class="cluster spacer" id="completion-actions"><button id="again" class="button primary">Practice again <span aria-hidden="true">↺</span></button><button id="return-entry" class="button secondary">New tutorial</button></div></section>`;
}
function render(focus=true) {
  if (!state.lesson) return;
  const focusId=document.activeElement?.id;
  $("#main").innerHTML=({entry,processing,overview,step:practice,complete:completion}[state.screen]||entry)();
  renderNav(); bind();
  if(focus) $("#main").focus({preventScroll:true});
  else if(focusId) {const previous=document.getElementById(focusId);if(previous&&!previous.disabled)previous.focus({preventScroll:true});}
}
function toBase64(buffer) {
  const bytes=new Uint8Array(buffer); let binary="";
  for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
async function choosePhoto(file, label) {
  const generation=++uploadGeneration;
  if(!file) return;
  try {
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPEG or WebP image.");
    if(file.size>5*1024*1024) throw new Error("That photo is larger than 5 MiB. Resize it or choose a smaller image.");
    const buffer=await file.arrayBuffer();
    if(generation!==uploadGeneration||state.screen!=="step") return;
    if(state.photo?.preview?.startsWith("blob:")) URL.revokeObjectURL(state.photo.preview);
    state.photo={base64:toBase64(buffer),mime:file.type,preview:URL.createObjectURL(file),label:label||file.name||"Your photo"};
    state.feedback=null; state.error=null; render(false); $("#check-photo")?.focus(); announce("Photo preview ready. Check your work when ready.");
  } catch(error) { state.error=error.message; render(false); announce(error.message); }
}
async function loadFixture(which) {
  const response=await fetch(`/fixtures/images/${step().id}_${which}.png`);
  if(!response.ok) throw new Error("Sample image could not be loaded.");
  await choosePhoto(await response.blob(),`Sample: ${which.replace("hidden","obstructed")}`);
}
async function checkPhoto() {
  if(!state.photo||state.busy) return;
  const generation=++actionGeneration;
  state.busy=true; state.feedback=null; state.error=null; render(false); announce("Checking the photo.");
  try {
    const value=await api(state.preview?"/api/preview/assess":"/api/assess", {schema_version:"hashir.ai.v1-proposed",submission_id:"demo_"+crypto.randomUUID(),lesson_id:state.lesson.id,step:step(),mime_type:state.photo.mime,image_base64:state.photo.base64});
    if(generation!==actionGeneration) return;
    state.feedback=value; announce(`Assessment: ${value.result}. ${value.feedback}`);
  } catch(error) { if(generation===actionGeneration) {state.error=error.message; announce(error.message);} }
  finally { if(generation===actionGeneration) {state.busy=false; render(false); refreshBudget(); ($("#next-step")||$("#assessment-feedback")||$("#check-photo"))?.focus();} }
}
async function stopLive(refresh=true) {
  liveGeneration++; clearTimeout(frameTimer); clearTimeout(pollTimer); state.running=false;
  try { await api("/api/live/stop",{}); } catch(error) { state.error=error.message; }
  state.frameMeta="Feedback stopped. Pending results have been discarded.";
  if(refresh) {state.feedback=null; render(false); announce("Live feedback stopped.");}
}
async function startLive() {
  const generation=++liveGeneration;
  state.running=true; state.feedback=null; state.error=null; frameCount=0;
  state.frameMeta="Starting the sample frame processor…"; render(false);
  try {
    await api("/api/live/start",{step_id:step().id});
    if(generation!==liveGeneration) return;
    const feed=async()=>{
      if(generation!==liveGeneration||!state.running) return;
      const which=state.index===0?["mistake","blurred","correct"][frameCount%3]:"correct";
      const path=`/fixtures/images/${step().id}_${which}.png`;
      const response=await fetch(path); const blob=await response.blob(); const buffer=await blob.arrayBuffer();
      if(generation!==liveGeneration) return;
      state.frame=path;
      const frameID="sample_"+(++frameCount);
      await api("/api/live/frame",{schema_version:"hashir.ai.v1-proposed",session_id:"local_demo",step_id:step().id,frame_id:frameID,captured_at:new Date().toISOString(),mime_type:"image/png",image_base64:toBase64(buffer)});
      if(generation!==liveGeneration) return;
      render(false); frameTimer=setTimeout(()=>feed().catch(fail),state.isMock?1800:3200);
    };
    const poll=async()=>{
      if(generation!==liveGeneration||!state.running) return;
      const value=await api("/api/live/events",{});
      if(generation!==liveGeneration) return;
      for(const event of value.events) {
        if(event.step_id!==step().id) continue;
        if(event.type==="assessment") {state.feedback=event.assessment; state.error=null; state.frameMeta=`${event.frame_id} · ${event.latency_ms} ms · ${event.assessment.provider} · ${event.assessment.is_mock?"mock cost $0":"estimated $"+event.assessment.usage.estimated_cost_usd}`; announce(`Frame feedback: ${event.assessment.result}`);}
        else {state.error=event.error.message; announce(event.error.message);}
      }
      if(value.events.length) {render(false);refreshBudget();}
      pollTimer=setTimeout(()=>poll().catch(fail),500);
    };
    const fail=async(error)=>{if(generation===liveGeneration){await stopLive(false);state.error=error.message;render(false);announce(error.message);}};
    await feed(); await poll();
  } catch(error) {if(generation===liveGeneration){await stopLive(false);state.error=error.message;render(false);}}
}
function bind() {
  $("#tutorial-form")?.addEventListener("submit",async(event)=>{
    event.preventDefault(); const url=$("#tutorial-url").value; const generation=++actionGeneration;
    state.screen="processing"; state.error=null; state.preview=false; render(); announce("Preparing the practice lesson.");
    try {
      const lesson=await api("/api/ingest",{source_url:url});
      if(generation!==actionGeneration) return;
      state.lesson=lesson; state.screen="overview"; state.index=0; state.completed.clear(); render(); announce("Your seven-step practice lesson is ready.");
    } catch(error) {if(generation===actionGeneration){state.screen="entry";state.error=error.message;render();$("#tutorial-url")?.focus();}}
  });
  $("#begin")?.addEventListener("click",()=>{state.screen="step";state.index=0;state.mode="photo";state.preview=false;clearPhoto();render();});
  $("#again")?.addEventListener("click",()=>{state.completed.clear();state.screen="step";state.index=0;state.mode="photo";state.preview=false;clearPhoto();render();});
  $("#return-entry")?.addEventListener("click",()=>reset());
  $("#upload-zone")?.addEventListener("click",()=>$("#photo-file").click());
  $("#replace-photo")?.addEventListener("click",()=>$("#photo-file").click());
  $("#photo-file")?.addEventListener("change",event=>choosePhoto(event.target.files[0]));
  const zone=$("#upload-zone");
  if(zone) {
    zone.addEventListener("dragover",event=>{event.preventDefault();zone.classList.add("dragging");});
    zone.addEventListener("dragleave",()=>zone.classList.remove("dragging"));
    zone.addEventListener("drop",event=>{event.preventDefault();zone.classList.remove("dragging");choosePhoto(event.dataTransfer.files[0]);});
  }
  document.querySelectorAll("[data-fixture]").forEach(button=>button.addEventListener("click",()=>loadFixture(button.dataset.fixture).catch(error=>{state.error=error.message;render(false);})));
  $("#check-photo")?.addEventListener("click",checkPhoto);
  $("#next-step")?.addEventListener("click",()=>{
    if(state.feedback?.result!=="pass") return;
    state.completed.add(step().id); clearPhoto();
    if(state.index===6) state.screen="complete"; else state.index++;
    render(); announce(state.screen==="complete"?"Local practice complete.":`Step ${state.index+1} of 7.`);
  });
  for(const mode of ["photo","live"]) $("#"+mode+"-mode")?.addEventListener("click",async()=>{if(state.mode===mode)return;await stopLive(false);actionGeneration++;state.busy=false;clearPhoto();state.frame=null;state.frameMeta="";state.mode=mode;render(false);$("#"+mode+"-mode").focus();});
  $("#start-live")?.addEventListener("click",startLive);
  $("#stop-live")?.addEventListener("click",()=>stopLive());
}
async function reset() {
  await stopLive(false); actionGeneration++;clearPhoto();state.screen="entry";state.index=0;state.busy=false;state.preview=false;state.completed.clear();render();
}
$("#home").addEventListener("click",reset);
$("#inspect-toggle").addEventListener("click",()=>{
  const open=$("#inspector").hidden; $("#inspector").hidden=!open;$("#inspect-toggle").setAttribute("aria-expanded",String(open));
  if(open) $("#state-select").focus();
});
function closeInspector() {$("#inspector").hidden=true;$("#inspect-toggle").setAttribute("aria-expanded","false");$("#inspect-toggle").focus();}
$("#close-inspector").addEventListener("click",closeInspector);
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!$("#inspector").hidden)closeInspector();});
$("#show-state").addEventListener("click",async()=>{
  await stopLive(false);actionGeneration++;clearPhoto();state.busy=false;state.preview=true;state.index=0;state.mode="photo";state.frame=null;state.frameMeta="";
  const selected=$("#state-select").value;
  const errors={unsupported_link:"Only https://origami.me/cup/ is supported by this version.",insufficient_source:"Tutorial wording changed or is unreviewed. Review it before generating steps.",upload_failure:"That photo could not be read. Choose a valid PNG, JPEG or WebP under 5 MiB.",provider_failure:"Assessment provider timed out. Your work is still here; try checking it again."};
  state.screen=["entry","processing","overview","complete"].includes(selected)?selected:"step";
  if(["unsupported_link","insufficient_source"].includes(selected)){state.screen="entry";state.error="Simulated error: "+errors[selected];}
  if(selected==="live")state.mode="live";
  render();
  if(["preview","assessing","pass","retry","uncertain","provider_failure"].includes(selected))await loadFixture(selected==="retry"?"mistake":selected==="uncertain"?"blurred":"correct");
  if(["pass","retry","uncertain"].includes(selected))await checkPhoto();
  if(selected==="assessing"){state.busy=true;announce("Assessment loading component preview. Use the state explorer to select another state.");}
  if(["upload_failure","provider_failure"].includes(selected))state.error="Simulated error: "+errors[selected];
  render(false);
});
const configRequest=window.ShowOncePublic?window.ShowOncePublic.config():fetch("/api/config").then(response=>{if(!response.ok)throw new Error("Local demo unavailable.");return response.json();});
configRequest.then(config=>{state.token=config.token;state.lesson=config.lesson;state.isMock=config.is_mock;updateProviderNotice(config);render(false);}).catch(()=>{$("#main").innerHTML=errorBox("The preview could not start. Please reload the page.");});

function updateProviderNotice(config) {
  if(config.public_preview) {$("#provider-notice").textContent="Public preview · mock feedback · photos stay in your browser. No AI credits used.";return;}
  if(config.is_mock) $("#provider-notice").textContent="Fixture mode · sample images and annotated feedback. No AI credits used.";
  else {
    const budget=config.budget;
    $("#provider-notice").textContent=`Meta vision · real model feedback · local budget: $${budget.charged_or_reserved_usd.toFixed(4)} / $5 charged or reserved. State-explorer assessments stay free.`;
  }
}
async function refreshBudget() {
  if(state.isMock) return;
  try {const response=await fetch("/api/config");if(response.ok)updateProviderNotice(await response.json());} catch {}
}
