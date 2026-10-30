# Professional acceptance matrix — Meta Wonder working copy

Date: 29 October 2026. Copy: `Professional-Work` (new working copy of
`Professional/`; pristine handoff and `Hobby-Original/` untouched).
No live provider calls were made; all AI behaviour is mock/fixture tested.
Physical-device and hosted-identity items remain pending by design.

| # | Assignment | Status | Evidence |
|---|---|---|---|
| 1 | Professional identity & landing | Done (code+tests+browser) | Trade gallery cards (Electrical/Plumbing/Carpentry + Training hub), nav labels Training hub / New training brief / Instructor review, corrected evidence/instructor claims in `strings.ts`; `tests/horizontal-gallery.test.tsx` (professional variant + claim wording); browser check on local preview: trade titles present, Hobby titles absent, honest claims rendered |
| 2 | Training hub & learner workflow | Done (code+tests+browser) | CourseCard shows server `description`; library view gained Saved training briefs summary + continue links (requests already loaded server-side); counters/next-action/prerequisite locks were already present and remain covered by `tests/professional-studio.test.tsx`; browser: briefs section + catalogue description render with learner fixture |
| 3 | Brief & source reliability | Done (test-proven) | New Worker test proves trade/experience/target-outcome reach the mocked AI input as labelled learner data (`scripts/professional-test.mjs`); persistence, replay binding and validation were already covered (test 49 pattern). No importer changes needed; bounded/SSRF source handling untouched |
| 4 | Evidence journal & sharing | Done (test-proven) | New Worker test: simultaneous identical saves store exactly one record (200+201, same id). Ownership, revocation, deletion tombstones, failed-upload retry and review locks were already covered; no races demonstrated, so no code change |
| 5 | Courses & instructor review | Done (docs) | `docs/professional-curriculum-versioning.md` defines immutable lesson IDs, new-version flow, and the instructor validation checklist. Catalogue already labels content "instructor validation pending"; no lesson content was changed, so no sessions are invalidated. Authoring/cohorts remain a documented next phase |
| 6 | Camera & photo experience | Verified only | Inherited LiveCamera already covers permission/switch/stop/background/stale/disconnect with cleanup and single explicit paid checks (covered by this copy's frontend suite; see `docs/live-camera.md` checklist). No code change. Physical Android/iPhone acceptance remains PENDING — no devices available here, none claimed |
| 7 | Step questions, images & feedback | Verified only | Workspace in this copy already carries question fields, image fallbacks, saved observations, report binding and stale-response guards from prior verified work; full suite green. No new defects demonstrated |
| 8 | Performance without visual regression | No change (by evidence) | Existing visible-frame-loop/RAF-pause/reduced-motion tests pass unchanged; no bottleneck was measured in this session, so no animation code was touched. Phone FPS remains unmeasured — not claimed |
| 9 | Security, privacy & budget review | Done (report) | `docs/professional-security-review.md`: identity, allowlist, origin, evidence-sharing, source-import and US$5 reservation evidence with file/test references; package hygiene rules. Not a comprehensive audit |
| 10 | Release & handoff QA | Done (this package) | Clean `npm ci`, baseline and final test/build/smoke runs recorded; isolated preview on loopback with synthetic fixtures only; no deployment, no GitHub changes. Hosted identity, real sign-in and deployment remain pending external steps |

## Pending (human / external)

- Physical Android/Chrome and iPhone/Safari camera + evidence acceptance
- Qualified instructor curriculum validation (checklist in
  `docs/professional-curriculum-versioning.md`)
- Real hosted identity, database/bucket bindings and isolated deployment
- Live Meta/provider acceptance with a configured server key (separate
  approval; US$5 runtime cap unchanged)
- Course authoring / cohort administration (documented next phase)

## Rollback

This work lives only in `Professional-Work/`. The pristine
`Professional/` and `Hobby-Original/` trees are untouched (hash-verified
against the handoff manifest), so rollback is: delete `Professional-Work/`
and use the pristine copy. Nothing was deployed or published.
