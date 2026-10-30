/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Return rule names only: diagnostics must never print the matching secret.
 * @param {string} text
 * @param {{browser?:boolean,secrets?:string[]}} [options]
 */
export function secretRules(text,{browser=false,secrets=[]}={}){
 const issues=[];
 if(/(?:LLM_[A-Za-z0-9_-]{20,}|sd_[A-Za-z0-9_-]{24,}|sk-[A-Za-z0-9_-]{24,})/.test(text))issues.push('provider_key_literal');
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))issues.push('private_key');
 if(secrets.some(value=>typeof value==='string'&&value.length>=8&&text.includes(value)))issues.push('runtime_secret_value');
 if(browser&&/NEXT_PUBLIC_[A-Z0-9_]*(?:API_KEY|SECRET|ACCESS_TOKEN)/.test(text))issues.push('public_secret_variable');
 if(browser&&/https:\/\/(?:api\.meta\.ai|api\.supadata\.ai)(?:\/|["'\s])/.test(text))issues.push('direct_provider_endpoint');
 return issues;
}
/** @param {string} root
 * @param {{secrets?:string[]}} [options]
 */
export async function scanPublicFiles(root,{secrets=[]}={}){
 const violations=[];let checkedFiles=0;
 const visit=async(dir,browser)=>{let children;try{children=await readdir(path.join(root,dir),{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of children){const name=path.join(dir,entry.name);if(entry.isSymbolicLink()){violations.push({path:name,rule:'unexpected_symlink'});continue;}if(entry.isDirectory()){await visit(name,browser);continue;}if(!entry.isFile())continue;
   if(browser&&/^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?)$|\.(?:pem|key)$/i.test(entry.name))violations.push({path:name,rule:'credential_file'});
   const text=await readFile(path.join(root,name),'utf8');checkedFiles++;for(const rule of secretRules(text,{browser,secrets}))violations.push({path:name,rule});
  }
 };
 for(const dir of ['src','public','out'])await visit(dir,true);
 for(const dir of ['services/learning/hashir/public-site/src','services/learning/hashir/public-site/web'])await visit(dir,false);
 return {checkedFiles,violations};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(import.meta.dirname,'..');
 const secrets=Object.entries(process.env).filter(([name,value])=>/(?:API_KEY|SECRET|ACCESS_TOKEN)$/.test(name)&&value).map(([,value])=>value);
 const report=await scanPublicFiles(root,{secrets});
 if(report.violations.length){console.error(JSON.stringify({message:'Credential safety check failed. Values are redacted.',...report}));process.exitCode=1;}
 else console.log(`Credential safety check passed: ${report.checkedFiles} source and browser files scanned; no credential values found.`);
}
