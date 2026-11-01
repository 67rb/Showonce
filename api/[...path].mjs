// Vercel serverless catch-all that runs the Show Once Worker unchanged.
// Replaces Cloudflare D1/R2 bindings with a durable LibSQL (SQLite) backend so
// the same Worker code runs on Vercel without changing its SQL.
/* Copyright © 2026 Show Once. All rights reserved. */
import { createClient } from '@libsql/client';
import { MIGRATIONS } from '../server/vercel-migrations.mjs';
import worker from '../server/vercel-worker.mjs';

const env = process.env;

// ---- D1-compatible adapter over LibSQL (SQLite) ----
function makeDB(client) {
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
      sql,
      args,
      first: async () => (await execute(sql, args)).rows[0] ?? null,
      run: async () => runResult(await execute(sql, args)),
      all: async () => ({ results: (await execute(sql, args)).rows }),
    });
    return { ...one([]), bind: (...args) => one(args) };
  };
  const db = {
    prepare,
    async batch(statements) {
      // Statements are [{sql,args}] from prepared/bound D1 statements.
      const proto = statements.map((s) => ({ sql: s.sql, args: s.args ?? [] }));
      const results = await client.batch(proto, 'write');
      return results.map((r) =>
        runResult({
          changes: typeof r.rowsAffected === 'bigint' ? Number(r.rowsAffected) : (r.rowsAffected ?? 0),
          lastInsertRowid: typeof r.lastInsertRowid === 'bigint' ? Number(r.lastInsertRowid) : r.lastInsertRowid,
        }),
      );
    },
  };
  return db;
}

// ---- R2-compatible blob bucket backed by a durable table ----
async function ensureBlobTable(client) {
  await client.execute({
    sql: 'CREATE TABLE IF NOT EXISTS vercel_blobs (key TEXT PRIMARY KEY, data BLOB, mime_type TEXT)',
    args: [],
  });
}
export function makeBucket(client) {
  return {
    async put(key, data, opts = {}) {
      const mime = opts?.httpMetadata?.contentType ?? 'application/octet-stream';
      await client.execute({
        sql: 'INSERT INTO vercel_blobs (key, data, mime_type) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, mime_type=excluded.mime_type',
        args: [String(key), data, mime],
      });
    },
    async get(key) {
      const r = await client.execute({ sql: 'SELECT data, mime_type FROM vercel_blobs WHERE key=?', args: [String(key)] });
      const row = r.rows && r.rows[0];
      if (!row) return null;
      const bytes = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : Uint8Array.from(row.data);
      return { body: bytes, mimeType: row.mime_type };
    },
    async delete(key) {
      await client.execute({ sql: 'DELETE FROM vercel_blobs WHERE key=?', args: [String(key)] });
    },
  };
}

// ---- Migration runner (idempotent, runs on cold start) ----
async function runMigrations(client) {
  await client.execute({ sql: 'CREATE TABLE IF NOT EXISTS vercel_migrations (name TEXT PRIMARY KEY)', args: [] });
  const applied = new Set((await client.execute('SELECT name FROM vercel_migrations')).rows.map(row => row.name));
  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    const tx = await client.transaction('write');
    try {
      const existing = await tx.execute({ sql: 'SELECT name FROM vercel_migrations WHERE name=?', args: [m.name] });
      if (!existing.rows.length) {
        for (const stmt of m.statements) await tx.execute({ sql: stmt, args: [] });
        await tx.execute({ sql: 'INSERT INTO vercel_migrations (name) VALUES (?)', args: [m.name] });
      }
      await tx.commit();
    } finally { tx.close(); }
  }
}

let runtimePromise = null;
async function getEnv() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      if (!env.TURSO_URL) {
        throw new Error('Storage is not configured. Set TURSO_URL (and TURSO_AUTH_TOKEN) in the Vercel project environment variables.');
      }
      const client = createClient({
        url: env.TURSO_URL,
        authToken: env.TURSO_AUTH_TOKEN || undefined,
      });
      await ensureBlobTable(client);
      await runMigrations(client);
      return {
        DB: makeDB(client),
        BUCKET: makeBucket(client),
        MODEL_API_KEY: env.MODEL_API_KEY,
        SUPADATA_API_KEY: env.SUPADATA_API_KEY,
        SUPADATA_ENABLED: env.SUPADATA_ENABLED,
        ADMIN_EMAILS: env.ADMIN_EMAILS,
      };
    })().catch(error => { runtimePromise = null; throw error; });
  }
  return runtimePromise;
}

function webRequest(req, bodyBuffer) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    // Vercel does not authenticate ChatGPT identity headers. Never trust a
    // caller claiming to be a learner or administrator through these headers.
    if (k.toLowerCase().startsWith('oai-authenticated-user-')) continue;
    headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
  }
  const body =
    req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'
      ? undefined
      : new Uint8Array(bodyBuffer || []);
  const proto = (headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = headers.get('x-forwarded-host') || headers.get('host');
  // Vercel Node functions surface the path + query in req.url. Split them.
  const [rawPath, rawQuery = ''] = String(req.url || '/').split('?');
  // vercel.json rewrites map /v1/*, /health and /examples/* to /api/... so the
  // Worker still sees its own route prefixes. Reconstruct the original path.
  let path = rawPath;
  if (path.startsWith('/api/v1/')) path = '/v1' + path.slice('/api/v1'.length);
  else if (path === '/api/health') path = '/health';
  else if (path.startsWith('/api/examples/')) path = '/examples' + path.slice('/api/examples'.length);
  const query = rawQuery ? '?' + rawQuery : '';
  const url = `${proto}://${host}${path}${query}`;
  return { url, headers, body, method: req.method };
}

async function readBody(req) {
  // Vercel may parse the body before invoking the Node handler.
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    return Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  return Buffer.concat(chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c))));
}

export default async function main(req, res) {
  let stage = 'request';
  try {
    const bodyBuffer = await readBody(req);
    const r = webRequest(req, bodyBuffer);
    stage = 'storage';
    const appEnv = await getEnv();
    stage = 'worker';
    const response = await worker.fetch(new Request(r.url, { method: r.method, headers: r.headers, body: r.body, cache: 'no-store' }), appEnv);
    stage = 'response';
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const payload = new Uint8Array(await response.arrayBuffer());
    if (response.status === 204 || req.method === 'HEAD') return res.end();
    res.end(payload);
  } catch (error) {
    let diagnostic = String(error?.stack || error?.message || error);
    for (const key of ['TURSO_URL', 'TURSO_AUTH_TOKEN', 'MODEL_API_KEY', 'SUPADATA_API_KEY']) {
      if (env[key]) diagnostic = diagnostic.split(env[key]).join('[REDACTED]');
    }
    console.error('showonce-backend-error', { stage, name: error?.name, code: error?.code, diagnostic: diagnostic.slice(0, 1200) });
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'service_unavailable', message: 'Backend unavailable. Please try again shortly.', retryable: true } }));
    } else {
      res.end();
    }
  }
}
