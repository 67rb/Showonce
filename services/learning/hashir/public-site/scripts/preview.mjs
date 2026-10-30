/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {localDB,localBucket} from './d1-local.mjs';
const text=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'))).default;
const DB=localDB(),BUCKET=localBucket();
// Explicit local-only identity fixture for exercising the internal forms. The
// Worker contains no fixture sign-in route and the listener never leaves loopback.
const adminFixture=process.argv.includes('--admin-fixture'),fixtureEmail='preview-team@example.test';
const portIndex=process.argv.indexOf('--port'),port=portIndex>=0?Number(process.argv[portIndex+1]):8014;if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Use a valid loopback port.');
const originIndex=process.argv.indexOf('--frontend-origin'),frontendOrigin=originIndex>=0?process.argv[originIndex+1]:null;if(frontendOrigin&&!/^http:\/\/(?:localhost|127\.0\.0\.1):[0-9]+$/.test(frontendOrigin))throw new Error('Frontend proxy origin must be loopback.');
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks),headers=new Headers(req.headers);for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-user-'))headers.delete(key);if(adminFixture){headers.set('oai-authenticated-user-id','local-preview-team');headers.set('oai-authenticated-user-email',fixtureEmail);}const runtimeOrigin='http://127.0.0.1:'+server.address().port;if(frontendOrigin){const allowed=new URL(frontendOrigin),incoming=headers.get('origin');if(incoming===frontendOrigin||incoming==='http://localhost:'+allowed.port||incoming==='http://127.0.0.1:'+allowed.port)headers.set('origin',runtimeOrigin);}const request=new Request(runtimeOrigin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:body});const response=await worker.fetch(request,{DB,BUCKET,ADMIN_EMAILS:adminFixture?JSON.stringify([fixtureEmail]):'[]'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Local preview error');}}).listen(port,'127.0.0.1',()=>console.log('Multi-skill Worker preview: http://127.0.0.1:'+server.address().port+' (no live key'+(adminFixture?', synthetic team identity':'')+')'));
