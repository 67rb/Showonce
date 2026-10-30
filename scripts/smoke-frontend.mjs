/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import assert from 'node:assert/strict';
import {cp} from 'node:fs/promises';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
// Exercise the built standalone output, including its copied static assets.
await cp('public','.next/standalone/public',{recursive:true});
await cp('.next/static','.next/standalone/.next/static',{recursive:true});
const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const server=spawn(process.execPath,['.next/standalone/server.js'],{env:{...process.env,PORT:String(port),HOSTNAME:'127.0.0.1',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});let diagnostics='';for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{diagnostics=(diagnostics+chunk).slice(-10000);});
try{
 const origin='http://127.0.0.1:'+port;let ready=false;
 for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error('Frontend exited before readiness: '+diagnostics);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(1000)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,100));}
 assert.ok(ready,'Built frontend did not become ready: '+diagnostics);
 for(const path of ['/','/lessons','/create','/privacy']){const response=await fetch(origin+path,{signal:AbortSignal.timeout(10000)});assert.equal(response.status,200,path);const html=await response.text();assert.match(html,/<html/);const css=html.match(/href="([^" ]+\.css[^" ]*)"/);if(css){assert.equal((await fetch(origin+css[1].replaceAll('&amp;','&'),{signal:AbortSignal.timeout(10000)})).status,200,'Built CSS asset');}}
 console.log('Built Next frontend smoke passed: 4 routes and their CSS.');
}finally{if(server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>{const deadline=setTimeout(()=>server.kill('SIGKILL'),5000);server.once('exit',()=>{clearTimeout(deadline);resolve();});});}}
