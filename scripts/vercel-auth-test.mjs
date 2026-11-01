// OAuth fixtures only: no real GitHub account, tokens, or paid providers.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encode } from '@auth/core/jwt';
import { authReady, authSettings, handleAuth, authenticatedIdentity, safeReturnTo } from '../server/auth.mjs';

const env = { AUTH_GITHUB_ID: 'fixture-client', AUTH_GITHUB_SECRET: 'fixture-secret', AUTH_SECRET: randomBytes(48).toString('base64url') };
const origin = 'https://app.example.test';
const realFetch = globalThis.fetch;
let verified = true, externalCalls = 0;
globalThis.fetch = async (url) => {
  externalCalls++;
  const path = String(url);
  if (path === 'https://github.com/login/oauth/access_token') return Response.json({ access_token: 'fixture-access', token_type: 'bearer', scope: 'read:user,user:email' });
  if (path === 'https://api.github.com/user') return Response.json({ id: 101, login: 'learner', name: 'Learner', email: 'untrusted@example.test' });
  if (path === 'https://api.github.com/user/emails') return Response.json([{ email: 'verified@example.test', primary: true, verified }]);
  throw new Error('Unexpected external call: ' + path);
};
function jar() {
  const values = new Map();
  return {
    read: () => [...values].map(([k,v]) => k + '=' + v).join('; '),
    update(response) { for (const cookie of response.headers.getSetCookie()) { const first = cookie.split(';')[0], at = first.indexOf('='); const key = first.slice(0, at), value = first.slice(at + 1); if (value) values.set(key, value); else values.delete(key); } },
  };
}
async function begin(cookies) {
  let response = await handleAuth(new Request(origin + '/api/auth/csrf'), env);
  cookies.update(response);
  const { csrfToken } = await response.json();
  response = await handleAuth(new Request(origin + '/api/auth/signin/github', {
    method: 'POST', headers: { cookie: cookies.read(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, callbackUrl: origin + '/professional/lessons/' }),
  }), env);
  assert.equal(response.status, 302);
  cookies.update(response);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.origin, 'https://github.com');
  assert.ok(destination.searchParams.get('state'));
  assert.equal(destination.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(!destination.searchParams.get('scope').includes('repo'));
  return destination.searchParams.get('state');
}
async function callback(cookies, state) {
  const response = await handleAuth(new Request(origin + '/api/auth/callback/github?code=fixture-code&state=' + state, { headers: { cookie: cookies.read() } }), env);
  cookies.update(response);
  return response;
}
try {
  assert.equal(authReady({}), false);
  assert.equal(authReady(env), true);
  assert.equal(safeReturnTo('https://evil.example/', origin), origin + '/');
  assert.equal(safeReturnTo('/\\evil.example/', origin), origin + '/');
  assert.equal(authSettings(new Request(origin), env).callbacks.signIn({ profile: { email_verified: false } }), false);
  const cookies = jar(), state = await begin(cookies);
  const response = await callback(cookies, state);
  assert.equal(response.headers.get('location'), origin + '/professional/lessons/');
  const identity = await authenticatedIdentity(new Request(origin + '/api/account', { headers: { cookie: cookies.read() } }), env);
  assert.deepEqual(identity.user, { subject: 'github:101', email: 'verified@example.test', name: 'Learner' });
  assert.ok(identity.cookies.some(c => c.includes('HttpOnly') && c.includes('Secure')));
  const forged = await authenticatedIdentity(new Request(origin + '/api/account', { headers: { cookie: '__Secure-authjs.session-token=forged', 'oai-authenticated-user-email': 'admin@example.test' } }), env);
  assert.equal(forged.user, null);
  const expired = await encode({ secret: env.AUTH_SECRET, salt: '__Secure-authjs.session-token', token: { sub: 'github:101', email: 'verified@example.test', verifiedEmail: true }, maxAge: -120 });
  assert.equal((await authenticatedIdentity(new Request(origin, { headers: { cookie: '__Secure-authjs.session-token=' + expired } }), env)).user, null);
  const csrfResponse = await handleAuth(new Request(origin+'/api/auth/csrf',{headers:{cookie:cookies.read()}}),env);
  cookies.update(csrfResponse);
  const signedOut = await handleAuth(new Request(origin+'/api/auth/signout',{method:'POST',headers:{cookie:cookies.read(),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken:(await csrfResponse.json()).csrfToken,callbackUrl:origin+'/'})}),env);
  cookies.update(signedOut);
  assert.equal((await authenticatedIdentity(new Request(origin,{headers:{cookie:cookies.read()}}),env)).user,null);
  verified = false;
  const deniedCookies = jar(), deniedState = await begin(deniedCookies);
  await callback(deniedCookies, deniedState);
  assert.equal((await authenticatedIdentity(new Request(origin, { headers: { cookie: deniedCookies.read() } }), env)).user, null);
  const noStateCookies = jar(); await begin(noStateCookies);
  await callback(noStateCookies, 'incorrect-state');
  assert.equal((await authenticatedIdentity(new Request(origin, { headers: { cookie: noStateCookies.read() } }), env)).user, null);
  console.log('OAuth fixture checks passed: PKCE/state, verified email, encrypted cookie, expiry, forged cookie refusal, redirect boundary; no real provider calls. Fixture calls: ' + externalCalls);
} finally { globalThis.fetch = realFetch; }
