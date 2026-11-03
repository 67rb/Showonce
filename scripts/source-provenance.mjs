/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {readFile,writeFile,mkdir,readdir,lstat,chmod} from 'node:fs/promises';
import {createHash,generateKeyPairSync,sign,verify,createPublicKey} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..');
const excluded=new Set(['.git','node_modules','.next','out','.local','__pycache__','.pytest_cache','.venv','venv','dist','worker','coverage','.vitest']);
const manifestPath='provenance/source-manifest.json',signaturePath='provenance/source-manifest.sig';
async function files(dir=''){
 const out=[];
 for(const e of await readdir(path.join(root,dir),{withFileTypes:true})){
  const p=path.posix.join(dir,e.name);
  if(excluded.has(e.name)||['.DS_Store','next-env.d.ts'].includes(e.name)||/\.(?:tsbuildinfo|pyc|log|sqlite(?:-.*)?|zip)$/.test(e.name)||/^(?:\.env|\.dev\.vars)/.test(e.name)||/\.(?:pem|key)$/.test(e.name)&&p!=='provenance/signing-public.pem'||[manifestPath,signaturePath,'server/vercel-worker.mjs'].includes(p))continue;
  if(e.isSymbolicLink())throw new Error(`Unexpected symlink: ${p}`);
  if(e.isDirectory())out.push(...await files(p));
  else if(e.isFile())out.push(p);
 }
 return out.sort();
}
const digest=b=>createHash('sha256').update(b).digest('hex');
const command=process.argv[2]||'verify';
if(command==='sign'){
 const dir=path.join(os.homedir(),'.showonce-signing');
 const keyPath=path.join(dir,'robe-berry-ed25519.pem');
 await mkdir(dir,{recursive:true,mode:0o700});await chmod(dir,0o700);
 let privateKey;
 try{privateKey=await readFile(keyPath,'utf8');}catch(e){
  if(e.code!=='ENOENT')throw e;
  const keys=generateKeyPairSync('ed25519',{privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
  privateKey=keys.privateKey;await writeFile(keyPath,privateKey,{flag:'wx',mode:0o600});
 }
 await chmod(keyPath,0o600);
 const publicKey=createPublicKey(privateKey).export({type:'spki',format:'pem'});
 await mkdir(path.join(root,'provenance'),{recursive:true});
 await writeFile(path.join(root,'provenance/signing-public.pem'),publicKey);
 const entries=[];
 for(const p of await files()){const b=await readFile(path.join(root,p));entries.push({path:p,bytes:b.length,sha256:digest(b)});}
 const manifest=Buffer.from(JSON.stringify({schema:1,created_at:new Date().toISOString(),owners:{application:'Robé Berry',ui:'Muhammad Hashir (https://github.com/mateir0)'},algorithm:'Ed25519',public_key_sha256:digest(publicKey),files:entries},null,2)+'\n');
 await writeFile(path.join(root,manifestPath),manifest);
 await writeFile(path.join(root,signaturePath),sign(null,manifest,privateKey).toString('base64')+'\n');
 console.log(`Signed ${entries.length} files. Public key SHA-256: ${digest(publicKey)}`);
}else if(command==='verify'){
 const raw=await readFile(path.join(root,manifestPath)), m=JSON.parse(raw);
 const pub=await readFile(path.join(root,'provenance/signing-public.pem'));
 if(digest(pub)!==m.public_key_sha256||!verify(null,raw,pub,Buffer.from((await readFile(path.join(root,signaturePath),'utf8')).trim(),'base64')))throw new Error('Signature verification failed');
 const current=await files();
 if(JSON.stringify(current)!==JSON.stringify(m.files.map(f=>f.path)))throw new Error('Source file list changed');
 for(const f of m.files){if(path.resolve(root,f.path)!==path.join(root,f.path)||!f.path||f.path.startsWith('../')||path.isAbsolute(f.path))throw new Error('Invalid manifest path');const b=await readFile(path.join(root,f.path));if(b.length!==f.bytes||digest(b)!==f.sha256)throw new Error(`Changed file: ${f.path}`);}
 console.log(`Verified signature and ${m.files.length} file fingerprints.`);
}else throw new Error('Use sign or verify');
