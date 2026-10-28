// Run the real HTTP smoke against the built Worker with migrated in-memory D1
// and an isolated bucket. No model key, public listener or persistent test data.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {localDB,localBucket} from './d1-local.mjs';
const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default,DB=localDB(),BUCKET=localBucket();
const server=createServer(async(req,res)=>{try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>7100000)throw new Error('Too large');chunks.push(chunk);}const headers=new Headers(req.headers);for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-user-'))headers.delete(key);const origin='http://127.0.0.1:'+server.address().port;const response=await worker.fetch(new Request(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),{DB,BUCKET});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(503);res.end('{}');}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
try{await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('./production-smoke.mjs',import.meta.url)),'http://127.0.0.1:'+server.address().port,'--local'],{stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Built deployment smoke failed ('+code+').')));});}finally{await new Promise(resolve=>server.close(resolve));DB.close();}
