/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import { Auth } from '@auth/core';
import GitHub from '@auth/core/providers/github';

export function authReady(env) {
  return !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET && env.AUTH_SECRET?.length >= 32);
}
function originFor(request, env) {
  return new URL(env.AUTH_URL || (env.VERCEL_PROJECT_PRODUCTION_URL
    ? 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL : request.url)).origin;
}
export function safeReturnTo(value, origin) {
  try {
    const url = new URL(value || '/', origin);
    if (url.origin === origin && !url.pathname.startsWith('/api/auth/')) return url.href;
  } catch {}
  return origin + '/';
}
export function authSettings(request, env) {
  const origin = originFor(request, env);
  return {
    basePath: '/api/auth', trustHost: true, secret: env.AUTH_SECRET,
    useSecureCookies: origin.startsWith('https:'),
    session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
    providers: [GitHub({
      clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET,
      checks: ['pkce', 'state'],
      userinfo: {
        url: 'https://api.github.com/user',
        async request({ tokens }) {
          const headers = { Authorization: 'Bearer ' + tokens.access_token, 'User-Agent': 'ShowOnce' };
          const [userResponse, emailResponse] = await Promise.all([
            fetch('https://api.github.com/user', { headers }),
            fetch('https://api.github.com/user/emails', { headers }),
          ]);
          if (!userResponse.ok || !emailResponse.ok) throw new Error('GitHub identity unavailable');
          const user = await userResponse.json(), emails = await emailResponse.json();
          const verified = Array.isArray(emails) && (emails.find(e => e.primary && e.verified) || emails.find(e => e.verified));
          if (!Number.isSafeInteger(user.id) || user.id <= 0 || !verified?.email) throw new Error('Verified GitHub email required');
          return { ...user, email: verified.email, email_verified: true };
        },
      },
    })],
    callbacks: {
      signIn: ({ profile }) => profile?.email_verified === true,
      jwt({ token, profile, account }) {
        if (account?.provider === 'github' && profile?.email_verified === true) {
          token.sub = 'github:' + profile.id;
          token.email = profile.email;
          token.verifiedEmail = true;
        }
        return token;
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub;
          session.user.verifiedEmail = token.verifiedEmail === true;
        }
        return session;
      },
      redirect({ url }) { return safeReturnTo(url, origin); },
    },
    logger: {
      error(error) { console.error('showonce-auth-error', { type: error?.type || error?.name }); },
      warn(code) { console.warn('showonce-auth-warning', code); },
    },
  };
}
export function accountLoginMetadata(request, env) {
  if (!authReady(env)) return { identity_provider: 'unconfigured', sign_in_url: null, sign_up_url: null, sign_out_url: null, recovery_url: null };
  const origin = originFor(request, env), destination = new URL(request.url).searchParams.get('return_to');
  const callbackUrl = encodeURIComponent(safeReturnTo(destination, origin));
  return {
    identity_provider: 'github', sign_in_url: origin + '/api/auth/signin?callbackUrl=' + callbackUrl,
    sign_up_url: origin + '/api/auth/signin?callbackUrl=' + callbackUrl,
    sign_out_url: origin + '/api/auth/signout?callbackUrl=' + callbackUrl,
    recovery_url: origin + '/api/auth/signin?callbackUrl=' + callbackUrl,
  };
}
export async function handleAuth(request, env) {
  const url = new URL(request.url);
  const legacy = ['/signin-with-chatgpt', '/signout-with-chatgpt'].includes(url.pathname);
  if (!legacy && !url.pathname.startsWith('/api/auth/')) return null;
  if (!authReady(env)) {
    if (url.pathname === '/api/auth/session') return Response.json({}, { headers: { 'Cache-Control': 'no-store' } });
    return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Show Once sign-in</title><main><h1>Sign-in is being set up</h1><p>You can still use free browser practice.</p><a href="/lessons/">Return to your lessons</a></main></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  if (legacy) {
    const metadata = accountLoginMetadata(request, env);
    return Response.redirect(url.pathname.startsWith('/signout') ? metadata.sign_out_url : metadata.sign_in_url, 303);
  }
  const origin = originFor(request, env);
  if (url.origin !== origin) return Response.redirect(origin + url.pathname + url.search, 303);
  return Auth(request, authSettings(request, env));
}
export async function authenticatedIdentity(request, env) {
  if (!authReady(env) || !/(?:^|;\s*)(?:__Secure-)?authjs\.session-token(?:\.\d+)?=/.test(request.headers.get('cookie') || '')) return { user: null, cookies: [] };
  // Read the authenticated cookie through Auth.js, never from bearer practice
  // tokens or from caller-supplied account headers.
  const sessionRequest = new Request(originFor(request, env) + '/api/auth/session', {
    headers: { cookie: request.headers.get('cookie') || '' },
  });
  const response = await Auth(sessionRequest, authSettings(request, env));
  const session = await response.json(), user = session?.user;
  const cookies = response.headers.getSetCookie();
  if (!response.ok || !user?.verifiedEmail || !/^github:\d+$/.test(user.id || '') || typeof user.email !== 'string') return { user: null, cookies };
  return { user: { subject: user.id, email: user.email, name: user.name || user.email }, cookies };
}
