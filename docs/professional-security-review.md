# Security, privacy and budget review — Professional working copy

Date: 29 October 2026. Scope: local source review of this working copy only.
This is a findings record with test evidence, not a comprehensive audit and
not a claim that the app is "secure".

## Boundaries verified in code and tests

- Identity is server-owned: account-owned sessions/evidence require the
  hosting identity headers; guest sessions require the SHA-256 token hash
  (`sessions.mjs`, `professional-evidence.mjs`). Frontend tests prove a
  different account sees none of the previous account's practices
  (`tests/learning.test.tsx`) and evidence reads return 404 cross-account
  (`scripts/professional-test.mjs`).
- Instructor access is the server `ADMIN_EMAILS` allowlist; self-approval is
  rejected and review writes are version-guarded
  (`professional.mjs`; `scripts/professional-test.mjs`).
- Mutations enforce same-origin `Origin` and JSON content type; report
  creation requires an exactly matching origin (`sessions.mjs`, `team.mjs`).
- Evidence sharing is explicit and revocable: instructor reads require
  `evidence_shared`, revocation blocks future reads, photos load only when
  opened, deletion tombstones cannot resurrect on replay
  (`professional-evidence.mjs`; evidence tests in
  `scripts/professional-test.mjs`). Revocation cannot retract a photo an
  instructor already downloaded — the UI copy must keep saying so.
- Source imports use an exact host allowlist, HTTPS only, streamed size/time
  limits and SSRF-conscious redirect handling (`core.mjs`, `sources.mjs`).
  Supadata remains free-only; exhaustion returns recovery states, never a
  paid fallback.
- Budget: the US$5 runtime pool is reserved before provider calls and
  settled after, with idempotency keys on every paid path (photo
  submissions, live checks with per-session lease + 20/24h cap, AI lesson
  generation, professional plan generation). Concurrent-reservation and
  failure behaviour are covered in `scripts/systems-test.mjs` and
  `scripts/professional-test.mjs`. The cap was not raised, reset or bypassed
  in this work.
- Secrets: `npm run build` runs `scripts/check-public-secrets.mjs` over
  source and browser bundles (406 files at baseline, 0 violations). No
  `NEXT_PUBLIC_` secret variables and no browser-direct provider calls were
  found; provider keys are server-only env.

## Known limits (not findings against this copy)

- Consent for AI checks is enforced in the client UI; the server accepts
  any request bearing a valid session credential. Server-side consent
  attestation would be a contract change.
- Camera feedback text is retained (last 20 per session) without a
  learner-facing delete; photo images are deletable, feedback/observations
  are not. Retention copy discloses this.
- Local development fixtures (learner/admin) are loopback-only synthetic
  identities, not hosted authentication evidence.
- Physical-device camera behaviour, hosted identity, and live provider
  behaviour are untested here by design (no key in this handoff).

## Package hygiene

Delivery archives exclude `node_modules`, `.next`, `out`, `dist`, `worker`,
`.local` state, databases, learner photos, env files and credentials.
Synthetic fixture images in source are test assets, not learner uploads.
