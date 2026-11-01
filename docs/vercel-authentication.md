# Production sign-in

Vercel uses Auth.js with GitHub OAuth. GitHub identity is verified on the server;
the app never trusts browser identity headers or a public profile email.
No paid authentication service is needed. Browser practice works without login.

## One-time owner setup

1. Create a GitHub OAuth app: https://github.com/settings/applications/new
   - Application name: ShowOnce
   - Homepage: https://showonce-professional-preview.vercel.app
   - Authorization callback URL:
     https://showonce-professional-preview.vercel.app/api/auth/callback/github
   - Only profile and verified email permissions are requested; no repository access.
2. Add these server-only **Production** environment variables in the Vercel project:
   - `AUTH_GITHUB_ID`: OAuth app Client ID.
   - `AUTH_GITHUB_SECRET`: OAuth app client secret.
   - `AUTH_SECRET`: generate using `openssl rand -base64 32` on your computer.
     Store it directly in Vercel; never paste it into chat or commit it.
   - `AUTH_URL`: `https://showonce-professional-preview.vercel.app`
   - Optional `ADMIN_EMAILS`: a JSON array of instructor/admin email addresses
     that are verified on those users' GitHub accounts. Choose these explicitly;
     repository collaborators do not automatically become app instructors.
3. Redeploy after saving. Open Lessons, select **Sign in with GitHub**, approve
   GitHub's permission prompt, and confirm the return to your original app page.
4. Test account library persistence and Professional enrollment with two separate
   GitHub users. Only an explicitly allowlisted verified email should see the
   instructor desk. Sign out on one device and verify private evidence is blocked.

The encrypted session lasts seven days and is stored in an HttpOnly Secure cookie
in production. State, PKCE, and CSRF checks protect login/logout. Redirects stay on
the production origin. Preview aliases use the production callback origin.

GitHub subjects are namespaced `github:<id>`; legacy ChatGPT accounts are not
automatically merged by email. Existing guest practice remains in that browser.
Do not rotate `AUTH_SECRET` casually: rotation invalidates existing sessions.

## Verification without credentials

- `npm run test:auth`: complete mocked OAuth flow, state/PKCE, verified email,
  encrypted cookie, expiry, forged cookie rejection, safe redirects, and logout.
- `node scripts/vercel-handler-test.mjs` (after `npm run build:vercel`): real
  Node HTTP handler with temporary SQLite, parsed forms, separate cookie headers,
  account separation, admin spoof rejection, protected enrollment, and persistence.
- Frontend tests cover timeout Retry and checkpoint navigation.

These fixtures call no live AI provider and spend no runtime allowance.
Without the OAuth variables, sign-in is honestly marked unconfigured. The legacy
login URL shows a setup message rather than a broken 404.
