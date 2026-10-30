/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readTutorialHTML,fetchTutorial,MAX_SOURCE_BYTES} from '../src/core.mjs';
const instructions='Draw a circle with a pencil on paper. Shade the lower edge gradually. Leave the upper area light. Blend the shaded edge gently with a finger.';
function responseChunks(value,size=17,headers={}){const bytes=new TextEncoder().encode(value);let offset=0;return new Response(new ReadableStream({pull(c){if(offset===bytes.length){c.close();return;}c.enqueue(bytes.subarray(offset,offset+size));offset=Math.min(bytes.length,offset+size);}}),{headers:{'content-type':'text/html',...headers}});}
test('reads an entire 600 MiB page with bounded heap and finds instructions at its end',()=>{
 const result=spawnSync(process.execPath,['--max-old-space-size=64',fileURLToPath(new URL('./large-source-smoke.mjs',import.meta.url))],{encoding:'utf8',timeout:45000});
 assert.equal(result.status,0,result.stderr||result.error?.message);assert.match(result.stdout,/629145600 bytes/);
});
test('accepts pages above the previous 1 MB cap without retaining scripts',async()=>{
 const source=await fetchTutorial('https://origami.me/cup/',async()=>responseChunks('<script>'+'x'.repeat(2*1024*1024)+'</script><p>'+instructions+'</p>',65536));assert.equal(source.text,instructions);
});
test('checks the 600 MiB cap before buffering a declared oversized body',async()=>{
 let cancelled=false;
 const response=new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'content-length':String(MAX_SOURCE_BYTES+1)}});
 await assert.rejects(()=>readTutorialHTML(response),e=>e.code==='source_too_large'&&/600 MB/.test(e.message));assert.equal(cancelled,true);
});
test('counts actual streamed bytes when Content-Length is missing or dishonest',async()=>{
 for(const headers of [{},{'content-length':'1'}]){
  let cancelled=false,reads=0;
  const response=new Response(new ReadableStream({pull(c){reads++;c.enqueue(new Uint8Array(64).fill(32));},cancel(){cancelled=true;}}),{headers});
  await assert.rejects(()=>readTutorialHTML(response,null,{maxBytes:100}),e=>e.code==='source_too_large');assert.equal(cancelled,true);assert.ok(reads<5);
 }
});
test('parses split tags, comments, entities, UTF-8 and scripts without leaking ignored content',async()=>{
 const html='<header>Hidden</header><!-- '+'x'.repeat(1000)+' --><h1>Paper é</h1><script>ignore <p>this</p></script><p>Draw &amp; shade &#x1F600; &lt;circle&gt;.</p>';
 assert.equal(await readTutorialHTML(responseChunks(html,1)),'Paper é\nDraw & shade 😀 <circle>.');
});
test('finds social descriptions and JSON-LD across arbitrary byte boundaries',async()=>{
 const html='<meta content="'+instructions+'" property="og:description"><script type="application/ld+json">'+JSON.stringify({articleBody:instructions})+'</script>';
 assert.equal(await readTutorialHTML(responseChunks(html,1),'Instagram'),instructions);
});
test('finds a YouTube description after a multi-megabyte script prefix',async()=>{
 const html='<script>'+'x'.repeat(2*1024*1024)+';player='+JSON.stringify({videoDetails:{shortDescription:instructions}})+'</script>';
 assert.equal(await readTutorialHTML(responseChunks(html,37),'YouTube'),instructions);
});
test('still bounds extracted text and cancels the remaining download',async()=>{
 let cancelled=false;const response=new Response(new ReadableStream({pull(c){c.enqueue(new TextEncoder().encode('<p>'+'word '.repeat(10000)+'</p>'));},cancel(){cancelled=true;}}));
 await assert.rejects(()=>readTutorialHTML(response),e=>e.code==='source_too_long');assert.equal(cancelled,true);
});
test('cancels a stalled source read at the deadline',async()=>{
 let cancelled=false;const controller=new AbortController();const response=new Response(new ReadableStream({cancel(){cancelled=true;}}));
 const pending=readTutorialHTML(response,null,{signal:controller.signal});controller.abort();
 await assert.rejects(()=>pending,e=>e.code==='source_timeout');assert.equal(cancelled,true);
});
test('accepts exactly 30,000 extracted characters independently of download size',async()=>{
 const text='a'.repeat(30000);
 assert.equal((await readTutorialHTML(responseChunks('<p>'+text+'</p>',1000))).length,30000);
 assert.equal((await readTutorialHTML(responseChunks('<meta name="description" content="'+text+'">',1000),'Instagram')).length,30000);
});
