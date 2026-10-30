/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const cwd=path.resolve(import.meta.dirname,'../services/learning/hashir/public-site');
for(const [command,args]of [[process.execPath,['scripts/assemble.mjs']],['bash',['scripts/build.sh']]]){const result=spawnSync(command,args,{cwd,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
