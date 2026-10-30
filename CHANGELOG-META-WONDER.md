# Meta Wonder working-copy changelog — 29 October 2026

Working copy of `Professional/` created for the Meta Wonder brief.
`Hobby-Original/` and the pristine `Professional/` are byte-for-byte intact
(hash-verified). No deployment, no GitHub changes, no live provider calls;
the US$5 runtime cap is untouched and no key was used or included.

## Coordination note

The prompt's 10-worker plan assumes a platform spending cap. This
environment provides no per-agent cost meter (`VERIFICATION.json` in the
handoff also records `agent_platform_billing_control_configured: false`),
so spawning 10 unmeasurable workers would violate the prompt's own
cost-bounding rule. The coordinator executed the 10 workstreams
sequentially in this single copy instead. Development spend on app
providers: $0 (mocks/fixtures only).

## Changes

- Professional landing (WS1): trade gallery cards replace Hobby capability
  cards on the Professional face (Hobby output unchanged); Professional
  nav renamed to Training hub / New training brief / Instructor review;
  AI claims corrected to visible-evidence + instructor-review language
  across hero, how-it-works, scope and create copy.
- Training hub (WS2): course cards show the server course description;
  library view shows a Saved training briefs summary with continue links.
- Brief reliability (WS3): regression test proves structured brief fields
  (trade, experience, target outcome) reach the mocked AI input.
- Evidence journal (WS4): regression test proves simultaneous identical
  saves store one record; no defect demonstrated, no code change.
- Courses (WS5): `docs/professional-curriculum-versioning.md` (immutable
  lesson IDs, validation checklist, claim discipline). No lesson content
  changed.
- Security/budget (WS9): `docs/professional-security-review.md` findings
  record with test evidence; no code change needed.
- Release QA (WS10): `docs/professional-acceptance.md` matrix,
  `docs/professional-handoff.md` updated for migration 0014 evidence
  sharing and structured brief fields.
- Test contract update: `tests/v13.test.tsx` mobile-CTA source assertion
  updated for the face-aware Professional CTA (Hobby rendering unchanged).

## Verification (final combined tree)

- `npm ci` clean; baseline before changes matched the handoff
  (298 frontend / 247 Worker / smoke 16 routes).
- `npm test`: frontend suite green (see delivery report for counts).
- `npm run build:professional` after tests: pass; credential scan 0
  violations.
- Worker `node --test .../scripts/*test.mjs`: green (+2 new tests).
- `npm run smoke`: pass, no paid requests.
- Browser (loopback learner fixture, current build): Professional landing
  renders trade gallery + corrected claims; Training hub renders briefs
  section + course descriptions. Console: 3 CSP errors blocking Google
  Fonts stylesheets in the local preview serving path (cosmetic in
  preview; production export self-hosts fonts). Screenshots unavailable
  (no visible desktop window); accessibility-tree/DOM evidence used.
  An unrelated pre-existing preview already occupied port 8031 and was
  left running; this work was verified on port 8033.
