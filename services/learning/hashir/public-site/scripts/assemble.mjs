/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {readFile,writeFile,readdir,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),assets={};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png'};
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(mime[path.extname(f)]){const route='/'+path.relative(path.join(root,'web'),f).replaceAll(path.sep,'/');assets[route]={type:mime[path.extname(f)],data:(await readFile(f)).toString('base64')};}}}
await walk(path.join(root,'web'));
// The product frontend is the static export of 67rb/Showonce. Runtime data stays
// on the same-origin Worker API; no account data or secret enters this export.
const frontendArgument=process.argv.indexOf('--frontend');
const frontend=frontendArgument>=0?path.resolve(process.argv[frontendArgument+1]):path.join(root,'frontend');
const frontendMime={...mime,'.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
async function frontendWalk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await frontendWalk(file);else{const route='/frontend/'+path.relative(frontend,file).replaceAll(path.sep,'/');assets[route]={type:frontendMime[path.extname(file)]||'application/octet-stream',data:(await readFile(file)).toString('base64')};}}}
if(await stat(path.join(frontend,'index.html')).catch(()=>null))await frontendWalk(frontend);
// Keep the library and app atomic even when a browser retains an older index.
assets['/app.js'].data=Buffer.from(await readFile(path.join(root,'web/practice-library.js'),'utf8')+'\n'+await readFile(path.join(root,'web/app.js'),'utf8')).toString('base64');
await mkdir(path.join(root,'worker'),{recursive:true});
await writeFile(path.join(root,'worker/index.js'),'const ASSETS='+JSON.stringify(assets)+';\n'+await readFile(path.join(root,'src/core.mjs'),'utf8')+'\n'+(await readFile(path.join(root,'src/sources.mjs'),'utf8')).replace(/^import[^\n]+\n/gm,'')+'\n'+await readFile(path.join(root,'src/accounts.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/team.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/sessions.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/questions.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/illustrations.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/professional-requests.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/professional-evidence.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/professional.mjs'),'utf8')+'\n'+await readFile(path.join(root,'src/routes.mjs'),'utf8'));
console.log('Assembled isolated Worker with '+Object.keys(assets).length+' explicit assets.');
