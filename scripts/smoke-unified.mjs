import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {localDB,localBucket} from '../services/learning/hashir/public-site/scripts/d1-local.mjs';
const root=path.resolve(import.meta.dirname,'..'),service=path.join(root,'services/learning/hashir/public-site'),source=await readFile(path.join(service,'dist/server/index.js'),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default,DB=localDB(),BUCKET=localBucket();
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-user-'))headers.delete(key);const response=await worker.fetch(new Request('http://127.0.0.1:'+server.address().port+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),{DB,BUCKET});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(503);res.end('{}');}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
try{
 const origin='http://127.0.0.1:'+server.address().port,assets=new Set();
 for(const route of ['/','/create/','/lessons/','/lesson/runtime/play/?lesson_id=example_draw-shading','/lesson/runtime/live/','/lesson/runtime/play/camera/','/privacy/','/studio','/team.html']){const response=await fetch(origin+route);assert.equal(response.status,200,route);const html=await response.text();assert.match(html,/<html/);if(route==='/')assert.match(html,/_next\/static/,'Root must use the GitHub Next frontend');if(route==='/studio')assert.match(html,/Practice Studio/);for(const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^" ]+)"/g))assets.add(match[1].replaceAll('&amp;','&'));assert.match(response.headers.get('permissions-policy'),/camera=\(self\)/);}
 for(const asset of assets){const response=await fetch(origin+asset);assert.equal(response.status,200,asset);assert.ok((await response.arrayBuffer()).byteLength>0);}
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(service,'scripts/production-smoke.mjs'),origin,'--local'],{stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('API deployment smoke failed.')));});
 console.log('Unified app smoke passed: 9 routes, '+assets.size+' Next assets and 31 API/deployment checks; no paid requests.');
}finally{await new Promise(resolve=>server.close(resolve));DB.close();}
