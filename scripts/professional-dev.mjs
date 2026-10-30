import {spawn,spawnSync} from 'node:child_process';
const cwd=new URL('..',import.meta.url);
const build=spawnSync('npm',['run','build:professional'],{cwd,stdio:'inherit'});if(build.status)process.exit(build.status);
// Explicit developer-only synthetic identity; never included in the Worker.
const args=['services/learning/hashir/public-site/scripts/professional-preview.mjs',...(!process.argv.includes('--port')?['--port','8035']:[]),...process.argv.slice(2)];
const child=spawn(process.execPath,args,{cwd,stdio:'inherit'});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exitCode=code||0);
