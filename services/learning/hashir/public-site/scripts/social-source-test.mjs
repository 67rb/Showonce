/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceURL,socialText,fetchTutorial} from '../src/core.mjs';
const instructions='Draw a circle with a pencil on paper. Shade the lower edge gradually. Leave the upper area light. Blend the shaded edge gently with a finger.';
const page=text=>new Response(text,{headers:{'content-type':'text/html'}});
test('accepts social post formats and removes tracking',()=>{
 for(const u of ['https://www.instagram.com/reel/Ab_cd1/?igsh=abc','https://instagram.com/p/ABC/','https://www.tiktok.com/@maker/video/123456','https://www.tiktok.com/@maker/photo/123456','https://vm.tiktok.com/ABC123/','https://vt.tiktok.com/ABC123/','https://www.tiktok.com/t/ABC123/','https://youtu.be/abcdefghijk?si=abc','https://youtube.com/watch?v=abcdefghijk&list=foo','https://youtube.com/shorts/abcdefghijk','https://x.com/maker/status/123456','https://twitter.com/maker/status/123456/photo/1'])assert.ok(sourceURL(u));
 assert.equal(sourceURL('https://youtu.be/abcdefghijk?si=abc').href,'https://www.youtube.com/watch?v=abcdefghijk');
 assert.equal(sourceURL('https://youtube.com/watch?v=abcdefghijk&list=foo').search,'?v=abcdefghijk');
});
test('rejects feeds, malformed IDs and hostile hosts',()=>{
 for(const u of ['https://instagram.com/maker','https://youtube.com/playlist?list=abc','https://youtube.com/watch?v=bad','https://x.com/home','https://tiktok.com/settings','https://instagram.com.evil.test/p/ABC','https://x.com@127.0.0.1/a','http://x.com/a/status/123'])assert.throws(()=>sourceURL(u));
});
test('extracts post descriptions and structured article bodies, excluding title and scripts',()=>{
 assert.equal(socialText(`<title>Misleading tutorial</title><meta content="${instructions}" property="og:description"><script>alert(1)</script>`),instructions);
 assert.equal(socialText(`<script type="application/ld+json">${JSON.stringify({'@graph':[{'articleBody':instructions}]})}</script>`),instructions);
 assert.equal(socialText('<title>Learn drawing</title><p>Sign in</p>'),'');
 assert.equal(socialText('<meta property="og:description" content="&lt;img onerror=alert(1)&gt;">'),'<img onerror=alert(1)>');
});
test('social extraction preserves provenance and does not claim video analysis',async()=>{
 const result=await fetchTutorial('https://instagram.com/p/ABC/',async()=>page(`<meta property="og:description" content="${instructions}">`));
 assert.equal(result.text,instructions);assert.equal(result.origin,'social_post_text');assert.match(result.limitations[0],/not analysed/);
});
test('title-only videos and blocked posts require transcript before AI generation',async()=>{
 for(const response of [()=>page('<title>How to draw a circle tutorial</title>'),()=>new Response('blocked',{status:403}),()=>page('<meta name="description" content="Log in to continue '+instructions+'">')])await assert.rejects(()=>fetchTutorial('https://youtube.com/watch?v=abcdefghijk',async()=>response()),e=>e.code==='transcript_required');
});
test('short links resolve only within same platform',async()=>{
 let calls=0;const result=await fetchTutorial('https://vm.tiktok.com/ABC/',async()=>++calls===1?new Response(null,{status:302,headers:{location:'https://www.tiktok.com/@maker/video/123'}}):page(`<meta name="description" content="${instructions}">`));
 assert.equal(calls,2);assert.equal(result.source_url,'https://www.tiktok.com/@maker/video/123');
 for(const target of ['https://127.0.0.1/a','https://origami.me/cup/','https://x.com/maker/status/123']){let count=0;await assert.rejects(()=>fetchTutorial('https://vm.tiktok.com/ABC/',async()=>{count++;return new Response(null,{status:302,headers:{location:target}});}));assert.equal(count,1);}
});

test('YouTube description is decoded without executing page scripts',()=>{const html='<script>var player='+JSON.stringify({videoDetails:{shortDescription:instructions}})+'</script>';assert.equal(socialText(html,'YouTube'),instructions);assert.equal(socialText(html,'Instagram'),'');});

test('preserves query parameters on existing article sources',()=>{assert.equal(sourceURL('https://www.instructables.com/lesson/?page=2#step').href,'https://www.instructables.com/lesson/?page=2');});

test('reported YouTube share URL and Shorts use the canonical watch URL',()=>{
 for(const link of ['https://youtu.be/aAxGTnVNJiE?si=pPAZk40h2UgMcc6W','https://youtube.com/shorts/aAxGTnVNJiE'])assert.equal(sourceURL(link).href,'https://www.youtube.com/watch?v=aAxGTnVNJiE');
});
test('Google access checks do not mislabel a valid YouTube link or get fetched',async()=>{
 for(const target of ['https://www.google.com/sorry/index?continue=https://www.youtube.com/watch?v=aAxGTnVNJiE','https://consent.youtube.com/m?continue=https://www.youtube.com/watch?v=aAxGTnVNJiE','https://accounts.google.com/ServiceLogin','https://127.0.0.1/admin']){
  let calls=0;
  await assert.rejects(()=>fetchTutorial('https://youtu.be/aAxGTnVNJiE?si=pPAZk40h2UgMcc6W',async(url)=>{calls++;assert.equal(url,'https://www.youtube.com/watch?v=aAxGTnVNJiE');return new Response(null,{status:302,headers:{location:target}});}),error=>error.code==='transcript_required'&&/YouTube link recognized/.test(error.message));
  assert.equal(calls,1);
 }
});
