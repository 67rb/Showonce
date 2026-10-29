import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),service=path.join(root,'services/learning/hashir/public-site');
for(const [command,args]of [[process.execPath,['scripts/assemble.mjs','--frontend',path.join(root,'out')]],['bash',['scripts/build.sh']],[process.execPath,['scripts/validate-artifact.mjs']]]){const result=spawnSync(command,args,{cwd:service,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
