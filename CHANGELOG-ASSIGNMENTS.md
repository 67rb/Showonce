# Assignment workflow changelog — 30 October 2026

Built on the delivered Integrated tree (306 frontend / 252 Worker baseline,
re-verified before changes). Hobby behaviour, the legacy course-review flow
for non-assignment enrollments, applied migrations 0000–0014 and all
existing records are preserved. No deployment, no live provider calls; the
US$5 runtime cap is untouched.

## Coordination note

The workflow prompt requires five worker agents only within the remaining,
measurable budget. This environment still provides no per-agent cost meter,
so the coordinator executed the five workstreams sequentially in this copy
rather than launching unbounded paid workers. Workstream ownership was
kept: (1) backend/migration, (2) trainee workspace, (3) instructor UI,
(4) Hobby boundary, (5) integration QA — integrated centrally.

## Changes

- Assignment lifecycle (WS1): migration `0015_professional_assignments.sql`
  (assignments + criterion decisions + evidence.criterion_id, append-only);
  server-enforced state machine preparation → practice → submitted →
  changes_requested → submitted → approved with frozen rubric, optimistic
  versions, idempotent evidence, self-assignment/self-assessment refusal,
  and a guard preventing legacy review decisions on unapproved assignments.
- Trainee workspace (WS2): assignment panel in the training hub — brief,
  preparation checklist, criteria with instructor decisions, explicit
  sharing submit/resubmit, next-action guidance; Passed only appears after
  server-recorded instructor approval of every required criterion.
  Evidence journal can link evidence to a criterion (notes alternative
  preserved).
- Instructor assessment (WS3): assignment creation (brief + observable
  rubric + preparation checks) and criterion-by-criterion
  approve/changes with feedback, append-only history, stale-version
  protection, on the real server allowlist.
- Hobby boundary (WS4): unchanged player/exploration; an automated
  same-lesson comparison proves free Hobby completion while the same
  content stays preparation-gated inside a Professional assignment.
- QA (WS5): full-cycle demonstration test (revision + resubmission +
  approval), bypass tests, privacy 404 for unrelated accounts, docs in
  `docs/professional-assignments.md`.

## Reliability fixes (30 October 2026, second pass)

- Reliable approval: criterion decision + assignment status now commit in
  one atomic batch (guarded insert + guarded update). A regression test
  aborts the decision insert with a database trigger and proves the
  assignment stays submitted and retryable; the test was mutation-checked
  against the previous sequential save, which wrongly approved.
- Real preparation checks: submission rechecks every required preparation
  item from the stored record regardless of stored status; optional items
  do not block. Tests cover a forced practice/incomplete record (409) and
  the optional-item path (200).
- Evidence inspection: the instructor assessment panel now loads submitted
  evidence beside each criterion (plus general evidence), with photos
  opened on demand. Frontend test asserts notes/photo access before any
  decision control is used.
- Workflow, mode slider, animations and the US$5 runtime cap are
  unchanged.

## Verification

- `npm test`: 310 frontend tests passed (baseline 306).
- Worker `node --test .../scripts/*test.mjs`: 255 passed (baseline 252),
  after rebuilding the Worker bundle.
- `npm run build:professional` (after tests): passed; credential scan 407
  files, 0 violations.
- `npm run smoke`: 16 routes, 38 Next assets, 31 API checks, 0 paid calls.
- Browser (loopback synthetic fixtures, persistent local store): full demo
  cycle executed via the real API (preparation → practice → submit →
  changes requested → revised evidence → resubmit → criterion approvals →
  approved), then verified in the learner hub (Passed banner + disclaimer)
  and instructor desk (assignment listed, assessment complete). Console:
  2 CSP font errors in the local preview path only. Screenshots were not
  available (no visible desktop window); DOM/accessibility evidence used.
  Two pre-existing previews on ports 8031/8035 were left untouched.

## Remaining limitations

Physical-device acceptance, qualified curriculum validation, hosted
identity/deployment, and live provider acceptance remain external. One
assignment per enrollment; rubric changes require a new assignment.
