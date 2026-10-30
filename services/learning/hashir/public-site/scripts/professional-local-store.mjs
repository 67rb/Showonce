// Local development only. Not imported into the deployed Worker.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {readFile,writeFile,rename,unlink,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
export function professionalLocalDB(directory){
 mkdirSync(directory,{recursive:true});const db=new DatabaseSync(path.join(directory,'professional.sqlite'));db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS local_schema_migrations(name TEXT PRIMARY KEY)');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort()){
  db.exec('BEGIN IMMEDIATE');try{if(!db.prepare('SELECT name FROM local_schema_migrations WHERE name=?').get(name)){db.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));db.prepare('INSERT INTO local_schema_migrations(name) VALUES(?)').run(name);}db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');db.close();throw error;}
 }
 const prepare=sql=>{const st=db.prepare(sql),methods=args=>({sql,args,first:async()=>st.get(...args)||null,run:async()=>st.run(...args),all:async()=>({results:st.all(...args)})});return {...methods([]),bind(...args){return methods(args);}};};
 return {prepare,async batch(statements){db.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>db.prepare(s.sql).run(...s.args));db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}},close:()=>db.close()};
}
export function professionalLocalBucket(directory){
 const root=path.join(directory,'photos'),file=key=>path.join(root,createHash('sha256').update(key).digest('hex'));
 return {async put(key,bytes){await mkdir(root,{recursive:true});const target=file(key),temp=target+'.'+randomUUID();await writeFile(temp,bytes);await rename(temp,target);},async get(key){try{return {body:new Uint8Array(await readFile(file(key))) };}catch(error){if(error.code==='ENOENT')return null;throw error;}},async delete(key){try{await unlink(file(key));}catch(error){if(error.code!=='ENOENT')throw error;}}};
}
