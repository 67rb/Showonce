import {spawnSync} from 'node:child_process';
for(const [command,args] of [[process.execPath,['scripts/prepare-service.mjs']],['npm',['run','build']]]){const result=spawnSync(command,args,{cwd:new URL('..',import.meta.url),stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
