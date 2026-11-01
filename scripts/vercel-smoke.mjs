// Local smoke test: proves the Worker runs against a LibSQL adapter (same code
// that runs on Vercel) before pushing. Uses a temp file DB.
/* Copyright © 2026 Show Once. All rights reserved. */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import worker from '../services/learning/hashir/public-site/worker/index.js';

const dir = mkdtempSync(join(tmpdir(), 'vercel-smoke-'));
const client = createClient({ url: 'file:' + join(dir, 'smoke.db') });

// Replicate the api/[...path].js helpers (kept minimal & verbatim).
const execute = async (sql, args = []) => {
  const r = await client.execute({ sql, args });
  return {
    rows: r.rows ?? [],
    changes: typeof r.rowsAffected === 'bigint' ? Number(r.rowsAffected) : (r.rowsAffected ?? 0),
    lastInsertRowid: typeof r.lastInsertRowid === 'bigint' ? Number(r.lastInsertRowid) : r.lastInsertRowid,
  };
};
const runResult = (r) => ({ meta: { changes: r.changes, last_row_id: r.lastInsertRowid ?? null }, changes: r.changes });
const prepare = (sql) => {
  const one = (args) => ({
    sql, args,
    first: async () => (await execute(sql, args)).rows[0] ?? null,
    run: async () => runResult(await execute(sql, args)),
    all: async () => ({ results: (await execute(sql, args)).rows }),
  });
  return { ...one([]), bind: (...args) => one(args) };
};
const DB = {
  prepare,
  async batch(statements) {
    const results = await client.batch(statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })), 'write');
    return results.map((r) => runResult({
      changes: typeof r.rowsAffected === 'bigint' ? Number(r.rowsAffected) : (r.rowsAffected ?? 0),
      lastInsertRowid: typeof r.lastInsertRowid === 'bigint' ? Number(r.lastInsertRowid) : r.lastInsertRowid,
    }));
  },
};
const BUCKET = {
  async put(key, data) { await client.execute({ sql: 'INSERT INTO vercel_blobs (key,data,mime_type) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data', args: [key, data, 'image/png'] }); },
  async get(key) { const r = await client.execute({ sql: 'SELECT data FROM vercel_blobs WHERE key=?', args: [key] }); return r.rows[0] ? { body: r.rows[0].data } : null; },
  async delete(key) { await client.execute({ sql: 'DELETE FROM vercel_blobs WHERE key=?', args: [key] }); },
};

await client.execute({ sql: 'CREATE TABLE IF NOT EXISTS vercel_blobs (key TEXT PRIMARY KEY, data BLOB, mime_type TEXT)', args: [] });
const { MIGRATIONS } = await import('../api/lib/migrations.mjs');
await client.execute({ sql: 'CREATE TABLE IF NOT EXISTS vercel_migrations (name TEXT PRIMARY KEY)', args: [] });
for (const m of MIGRATIONS) {
  const ex = await client.execute({ sql: 'SELECT name FROM vercel_migrations WHERE name=?', args: [m.name] });
  if (ex.rows.length) continue;
  for (const s of m.statements) await client.execute({ sql: s, args: [] });
  await client.execute({ sql: 'INSERT INTO vercel_migrations (name) VALUES (?)', args: [m.name] });
}

const env = { DB, BUCKET, MODEL_API_KEY: undefined, SUPADATA_API_KEY: undefined, SUPADATA_ENABLED: undefined, ADMIN_EMAILS: undefined };
const origin = 'http://localhost:3000';
async function call(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await worker.fetch(new Request(origin + path, { method: init.method || 'GET', headers, body: init.body ? JSON.stringify(init.body) : undefined }), env);
  const text = await response.text();
  console.log(response.status, path, text.slice(0, 120).replace(/\n/g, ' '));
  return { response, text };
}

try {
  let r = await call('/api/config');
  if (r.response.status !== 200) throw new Error('api/config failed');
  const cfg = JSON.parse(r.text);
  if (!cfg.examples || !cfg.examples.length) throw new Error('no examples in config');

  r = await call('/health');
  if (r.response.status !== 200) throw new Error('health failed');

  // Free numbered-lesson flow (no AI key needed).
  r = await call('/v1/lessons', { method: 'POST', body: { source_text: '1. Draw a circle on paper.\n2. Shade its lower edge.', processing_mode: 'structured_text' } });
  if (r.response.status !== 201) throw new Error('lesson create failed: ' + r.text);
  const lesson = JSON.parse(r.text);

  r = await call('/v1/sessions', { method: 'POST', body: { lesson_id: lesson.id } });
  if (r.response.status !== 201) throw new Error('session create failed: ' + r.text);
  const { session_id, access_token } = JSON.parse(r.text);
  if (!session_id || !access_token) throw new Error('no session/token');

  r = await call('/v1/sessions/' + session_id, { headers: { Authorization: 'Bearer ' + access_token } });
  if (r.response.status !== 200) throw new Error('session progress failed');

  // Bucket round-trip.
  await BUCKET.put('practice/x/y', new TextEncoder().encode('hello'));
  const got = await BUCKET.get('practice/x/y');
  if (!got || new TextDecoder().decode(got.body) !== 'hello') throw new Error('bucket round-trip failed');

  console.log('\nALL LOCAL CHECKS PASSED');
} finally {
  client.close();
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}