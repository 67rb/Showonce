// Exercise the real Node handler, including Vercel's already-parsed JSON bodies.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'showonce-handler-'));
process.env.TURSO_URL = 'file:' + join(dir, 'test.db');
delete process.env.TURSO_AUTH_TOKEN;
delete process.env.MODEL_API_KEY;
delete process.env.SUPADATA_API_KEY;
process.env.ADMIN_EMAILS = '["admin@example.test"]';
const { default: handler, makeBucket } = await import('../api/[...path].mjs');
const { createClient } = await import('@libsql/client');
const server = createServer(async (req, res) => {
  if (req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = JSON.parse(Buffer.concat(chunks).toString());
  }
  await handler(req, res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const call = async (path, body, headers = {}) => {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  assert.ok(text, path + " returned empty status " + response.status);
  const value = JSON.parse(text);
  assert.ok(response.ok, JSON.stringify({ status: response.status, value }));
  return value;
};
try {
  const config = await call('/api/config');
  assert.ok(config.examples.length);
  const client = createClient({ url: process.env.TURSO_URL });
  const bucket = makeBucket(client);
  const bytes = new Uint8Array([0, 1, 128, 255]);
  await bucket.put('private/test', bytes, { httpMetadata: { contentType: 'image/png' } });
  assert.deepEqual((await bucket.get('private/test')).body, bytes);
  await bucket.delete('private/test');
  assert.equal(await bucket.get('private/test'), null);
  client.close();
  const account = await call('/api/account', null, {
    'oai-authenticated-user-id': 'forged-admin',
    'oai-authenticated-user-email': 'admin@example.test',
  });
  assert.equal(account.authenticated, false);
  assert.equal(account.is_admin, false);
  const lesson = await call('/api/v1/lessons', {
    source_text: '1. Draw a circle on paper.\n2. Shade its lower edge.',
    processing_mode: 'structured_text',
  });
  const progress = await call('/api/v1/sessions', { lesson_id: lesson.id });
  assert.ok(progress.access_token);
  const saved = await call('/api/v1/sessions/' + progress.session_id, null, {
    Authorization: 'Bearer ' + progress.access_token,
  });
  assert.equal(saved.session_id, progress.session_id);
  assert.equal((await call('/api/config')).budget.charged_or_reserved_usd, 0);
  console.log('Real Vercel handler: config, parsed JSON, private session persistence, identity spoof refusal passed; 0 paid calls.');
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
}
