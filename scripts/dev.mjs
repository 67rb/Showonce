import {spawn,spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const prepared=spawnSync(process.execPath,[path.join(root,'scripts/prepare-service.mjs')],{cwd:root,stdio:'inherit'});if(prepared.status!==0)process.exit(prepared.status||1);
const children=[spawn(process.execPath,[path.join(root,'services/learning/hashir/public-site/scripts/preview.mjs'),'--port','8026','--frontend-origin','http://localhost:3000'],{cwd:root,stdio:'inherit'}),spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev'],{cwd:root,stdio:'inherit'})];
let closing=false;function close(){if(closing)return;closing=true;for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');}
process.on('SIGINT',close);process.on('SIGTERM',close);for(const child of children){child.on('error',error=>{console.error(error.message);close();process.exitCode=1;});child.on('exit',code=>{if(code&&!closing)process.exitCode=code;close();});}
