import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
/** @param {string|URL} [migrationDirectory] */
export function localDB(migrationDirectory=new URL('../drizzle/',import.meta.url)){
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(migrationDirectory).filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync(typeof migrationDirectory==='string'?path.join(migrationDirectory,file):new URL(file,migrationDirectory),'utf8'));
 const prepare=sql=>{const st=db.prepare(sql);const methods=args=>({sql,args,first:async()=>st.get(...args)||null,run:async()=>st.run(...args),all:async()=>({results:st.all(...args)})});return {...methods([]),bind(...args){return methods(args);}};};
 return {prepare,async batch(statements){db.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>db.prepare(s.sql).run(...s.args));db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},close(){db.close();}};
}
export function localBucket(){const values=new Map();return {async put(key,data){values.set(key,Uint8Array.from(data));},async get(key){const v=values.get(key);return v?{body:v}:null;},async delete(key){values.delete(key);}};}
