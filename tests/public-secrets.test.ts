/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import {describe,it,expect} from 'vitest';
import {secretRules,scanPublicFiles} from '../scripts/check-public-secrets.mjs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
describe('credential release guard',()=>{
 it('detects provider values without echoing them in diagnostics',()=>{const secret='LLM_'+ 'a'.repeat(40);const result=secretRules('const key="'+secret+'"',{browser:true});expect(result).toContain('provider_key_literal');expect(JSON.stringify(result)).not.toContain(secret);});
 it('detects configured secrets even with an unfamiliar provider format',()=>{const secret='private-'+ 'x'.repeat(30);expect(secretRules(secret,{secrets:[secret]})).toContain('runtime_secret_value');});
 it('rejects client credential variables and direct provider calls but accepts server bindings',()=>{expect(secretRules('process.env.NEXT_PUBLIC_META_API_KEY',{browser:true})).toContain('public_secret_variable');expect(secretRules('fetch("https://api.meta.ai/v1/responses")',{browser:true})).toContain('direct_provider_endpoint');expect(secretRules('env.MODEL_API_KEY; env.SUPADATA_API_KEY; fetch("https://api.meta.ai/v1/responses")')).toEqual([]);});
 it('scans nested build chunks and refuses credential files in public assets',async()=>{const root=await mkdtemp(path.join(tmpdir(),'showonce-credential-check-'));try{await mkdir(path.join(root,'out/_next'),{recursive:true});await mkdir(path.join(root,'public'));await writeFile(path.join(root,'public/.env'),'not-a-real-secret');await writeFile(path.join(root,'out/_next/chunk.js'),'sd_'+'b'.repeat(32));const result=await scanPublicFiles(root);expect(result.checkedFiles).toBe(2);const violations=result.violations.map(v=>({...v,path:v.path.replace(/\\/g,'/')}));expect(violations).toEqual(expect.arrayContaining([{path:'public/.env',rule:'credential_file'},{path:'out/_next/chunk.js',rule:'provider_key_literal'}]));expect(JSON.stringify(result)).not.toContain('b'.repeat(32));}finally{await rm(root,{recursive:true,force:true});}});
});
