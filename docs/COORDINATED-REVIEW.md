# Coordinated review — 2026-11-02 (first focused pass)

Scope: sample/practice/navigation regressions on GitHub `67rb/Showonce` master
`f093055e98a77e5780f8e39555afbb910531cb8a`, worked only in
`ShowOnce-Submission-20261102`. Prior copy `ShowOnce-Review-Work` was used
read-only for comparison. No paid provider calls, no deployment, no push.

## 1. Confirmed defect: deployed sample redirects hijack the paper-cup sample

- `vercel.json` redirected `/lesson/sample/play`, `/lesson/sample/play/camera`,
  `/lesson/sample/live`, `/lesson/sample/complete` to
  `/lesson/runtime/...?lesson_id=example_draw-shading` (drawing), while master
  supplies static SampleFixture pages for play/live.
- Live read-only evidence (2026-11-02, browser): opening
  `https://showonce-professional-preview.vercel.app/lesson/sample/play`
  landed on `/lesson/runtime/play/?lesson_id=example_draw-shading`.
- Local reproduction before fix: `tests/sample-routes.test.tsx` failed 2/3 —
  redirect sources shadow the sample routes; `/lesson/sample/complete` had no
  static page.

### Fix
- `vercel.json`: removed all four hobby sample redirects (compatibility
  `/lesson/runtime/...` routes remain untouched and functional).
- Added `src/app/(public)/lesson/sample/play/camera/page.tsx` (SampleFixture
  live face, paper cup) and `src/app/(public)/lesson/sample/complete/page.tsx`
  (paper-cup completion preview, fixture banner, links to overview/player).
- `SampleFixture.tsx`: previously dead verdict actions now navigate inside the
  sample — Retake → `<base>/play/camera`, Continue/Acknowledge →
  `<base>/complete` (hobby and professional bases).

### Evidence after fix
- Build output contains `out/lesson/sample/{play,play/camera,live,complete}`;
  built play HTML contains "Fold a paper cup" and no `example_draw-shading`.
- Local preview (Worker + static, port 8177) in browser: play, complete, and
  play/camera all stay on their sample URLs and render "Fold a paper cup"
  (complete also "Done."). Only console errors were pre-existing CSP font
  blocks in the local preview.

## 2. Sample start audit (Hobby + Professional)

- Hobby `SampleStart` and Professional `ProSampleStart` both create real free
  `structured_text` practice via the Worker and open the runtime player.
  Existing real-Worker test `tests/learning.test.tsx` ("starts the illustrated
  sample as real free practice and keeps its reference visual") passes; first
  checkpoint shows `/samples/origami/step-1.svg` with zero budget charged.
- No reproducible dead buttons/wrong destinations were found in the start
  flows themselves. The dead SampleFixture verdict buttons (finding above)
  were the reproducible navigation defect and are wired now.
- Not verified: physical-device camera, live Meta responses (no paid calls
  this pass by instruction). Browser evidence is desktop Chromium only.

## 3. Prior photo/Q&A fixes compared and ported

Compared `ShowOnce-Review-Work` against this master file by file. Already
present in master (not re-ported): identity no longer unmounts on tab
backgrounding; LiveCamera stop(preserve) semantics. Still missing and ported:

- `StepQuestions.tsx`: a server-returned `failed` record no longer clears the
  learner's typed question (both the ask-result and refresh paths). New test:
  "a failed answer keeps the typed question for editing".
- `Workspace.tsx`: photo/history/local-photo object URLs are revoked in
  separate effects, so changing one displayed image cannot revoke another.
- `Workspace.tsx` + `LiveCamera.tsx`: Check My Work now calls
  `mediaStop.current(true)`, stopping the camera without clearing the Live
  Camera self-review checklist/observations (stopRef type updated).
- Not ported (out of this pass's scope, still open from the earlier review):
  professional server enforcement items (assess-after-revoke, assignment on
  reviewed enrollment, latest-decision ordering in `professional.mjs:39,126`,
  evidence lock after submission, prep-gate fail-open in `sessions.mjs`).
  Backend evidence/instructor checks were not weakened.

## Verification (this tree, this pass)

- `npx vitest run tests/sample-routes.test.tsx tests/step-questions.test.tsx tests/learning.test.tsx` — 45 passed.
- `npm test` — 321 frontend tests passed (22 files), plus Auth.js fixture
  checks passed (PKCE/state, verified email, expiry, forged-cookie refusal;
  no real provider calls).
- `node --test services/learning/hashir/public-site/scripts/*test.mjs` — 258 passed.
- `npx tsc --noEmit` — clean.
- `npm run build` — passed; credential scan 468 files, no violations.
- `npm run smoke` (after build) — 16 routes, 36 Next assets, 31 API/deployment
  checks, $5 budget untouched, no paid requests. (Smoke must run after a full
  build; running it right after `npm test` fails on the API-only test
  assembly — pre-existing ordering note, also documented in README.)

## Remaining / next recommended pass

1. ~~Professional server enforcement batch~~ — done in pass 2 below.
2. ~~Professional sample camera/complete fixture routes~~ — done in pass 2 below.
3. Live Meta acceptance and physical Android/iPhone checks (external gates,
   need owner-provided key/devices; production OAuth variables unconfirmed).
4. Redeploy is required for the `vercel.json` fix to change the live site;
   the deployed defect remains live until then.

### Correction to pass 1 wording
Pass 1 said "both sample starts tested" but named only the Hobby real-Worker
test. Pass 2 adds the equivalent Professional test (below) and also fixes a
real defect it exposed: Professional sample reference visuals never reached
the player.

---

# Second focused pass — 2026-11-02

## A. Professional backend enforcement (reproduced first, then fixed)

New Worker tests were written against the current master first and failed:
evidence save after assignment submission returned **201** (expected 409);
lesson start with incomplete required preparation returned **200** (expected
409). Fixes, all in the assembled Worker sources:

- `professional-evidence.mjs`: evidence add, finish-upload, and delete now
  refuse (409 `evidence_locked`) while an assignment is `submitted`/`approved`;
  delete updates the DB record before deleting the stored photo.
- `professional.mjs`: assessment refuses when learner sharing is off
  (`evidence_not_shared`); assignment creation refuses enrollments already
  `pending_review`/`instructor_approved`; submit blocks on uploading evidence
  and commits status + evidence-sharing in one conditional batch; latest
  criterion decision ordered by monotonic `assignment_version, created_at, id`
  (was `created_at, id` with random IDs); lesson start is gated on required
  preparation, naming missing items.
- `sessions.mjs`: new `assignmentPrepBlock` gates photo submissions and
  acknowledgements for assigned practice; catalogue/DB errors now fail closed
  (503 `preparation_check_failed`) instead of silently allowing practice.
  In master this gate was absent outside submit — i.e. fail-open by omission.
- Optional preparation items never block (test proves an optional-only rubric
  starts practice freely). Instructor-only assess path and atomic
  decision/status batch unchanged.

Two pre-existing tests relied on the ungated behaviour and were updated to
assert the gate instead (start blocked before preparation, allowed after;
practice completed before assignment creation in the submit-recheck test).
Final Worker suite: **260 passed** (258 + 2 new), including the two new
enforcement tests by name:
"submitted assignment evidence is locked, assessment requires sharing, and
reviewed enrollments cannot be assigned" and "required preparation gates
lesson start and acknowledgements, optional preparation does not".

## B. Professional sample routing (Next 16 async params)

Root cause proven from bundled docs
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`):
in Next 16 `params` is a `Promise`; the pages read `params.id` synchronously,
so `id` was `undefined`, the `sample` branch never ran, and the runtime player
reported "That lesson is unavailable." Fixes:

- `(player)/play` and `(player)/live` pages: `await params`.
- `(player)/play/camera` and `(player)/complete`: now render SampleFixture /
  the new `SampleComplete` for `id=sample` instead of falling through to the
  runtime player. Fixture pages keep the explicit design-preview banner and
  link to real free practice on the sample overview; they do not claim a real
  camera is active.
- `professional/course/[id]` page: same synchronous-params defect hid the
  plumbing lessons; now awaited.
- `SampleFixture`: default verdict is no longer a forever "Checking your
  work…" spinner (defaults to the matched verdict; `?state=` variants still
  work), and the preview links to actual free practice.

Production-build browser proof (Playwright, Chrome, local preview of the
built app, 390px and 1280px): play, play/camera, live, complete, and the
plumbing course preview all render "Identify plumbing components", none show
"That lesson is unavailable" or a checking spinner, no horizontal overflow.

## C. Professional sample start test (correcting pass 1)

New real-Worker test in `tests/learning.test.tsx`: "starts the professional
sample as real free practice and keeps its reference visual". It failed to
find the visual before two small fixes: `ProSampleStart` now sends plain
numbered instructions (so server steps match the sample exactly) and
`StepIllustration` also matches `proSampleLesson` steps. The test asserts the
first checkpoint renders `/samples/plumbing/step-1.svg` with $0 charged.

## Verification (pass 2)

- Frontend: **322 passed** (321 + 1 Professional sample test) + Auth.js
  fixture checks, no real provider calls.
- Worker: **260 passed**. TypeScript clean. Build passed; credential scan
  clean. Smoke (after build): 16 routes, 36 assets, 31 checks, $5 untouched.
- Changed paths (pass 2): `services/learning/hashir/public-site/src/professional.mjs`,
  `professional-evidence.mjs`, `sessions.mjs`,
  `services/learning/hashir/public-site/scripts/professional-test.mjs`,
  `src/app/professional/lesson/[id]/(player)/{play,live,play/camera,complete}/page.tsx`,
  `src/app/professional/course/[id]/page.tsx`,
  `src/components/learning/SampleFixture.tsx, StepIllustration.tsx`,
  `src/components/professional/ProSampleStart.tsx`,
  `tests/learning.test.tsx`, this file.

## Unresolved evidence

- Live deployed site still shows both defects until redeploy.
- Live Meta acceptance was completed by the coordinator after pass 2 (not
  rerun here): hosted step Q&A 201 answered with an exact lesson quote, a
  synthetic circle photo 200/pass, and a contrast synthetic triangle on the
  same checkpoint 200/retry explicitly identifying a triangle instead of a
  circle; `is_mock=false`, live ledger US$0.197019 charged / US$4.802981 of
  US$5 remaining (logs: `/tmp/showonce-live-ai-acceptance.log`,
  `/tmp/showonce-live-ai-negative.log`). Synthetic drawings are not physical
  device evidence.
- Physical-device and production OAuth acceptance remain missing.

---

# Third focused pass — 2026-11-02 (commit-boundary concurrency)

Independent review found the pass-2 guards were check-then-write. Each race
was reproduced deterministically with a DB barrier wrapper in
`professional-test.mjs` (the wrapper commits a competing write through the
raw fixture DB exactly after the handler's matched read and before its
write; no threads or sleeps), then fixed in the commit predicates. Both DB
adapters (`scripts/d1-local.mjs`, `api/backend.mjs`) run `batch` as a real
transaction, and all new predicates are plain SQL valid on both.

Reproductions on pass-2 code (all 5 failed as predicted):
1. Revoke after assess precheck → decision still created (200).
2. Submit after evidence-delete check → evidence deleted (204).
3. Stale losing submit → revoked sharing silently restored to 1.
4. Upload starting after the submit precheck → submit committed (200).
5. Review between create eligibility check and INSERT → assignment created (201).

Fixes (commit predicates, prechecks retained for error quality):
1. `professional.mjs` assess: the decision INSERT now also requires
   `EXISTS(enrollment with evidence_shared=1)`; revocation winning the race
   yields zero inserted rows → 409, and the status UPDATE still depends on
   the decision row. Test proves no decision row and no version/status change.
2. `professional-evidence.mjs` DELETE: the evidence UPDATE carries
   `NOT EXISTS(assignment submitted/approved)`; the enrollment version bump
   requires the deleted row; zero-row delete → 409 and the blob is only
   deleted after a successful guarded delete. Test proves notes/photo remain
   inspectable (list + photo 200) when submit wins.
3. `professional.mjs` submit: the sharing UPDATE is predicated on the
   enrollment version this request read, assignment still at the read
   version in a submittable status, and no uploading evidence; the status
   UPDATE additionally requires sharing=1 at enrollment version+1 and no
   uploading evidence. A 409 now provably leaves sharing/status/versions
   untouched, including the stale-loser-after-revoke interleaving (test 3)
   and the upload interleaving (test 4). The pre-existing "failed decision
   save leaves the assignment unapproved and retryable" regression passes.
4. `professional.mjs` create: the INSERT is now `INSERT ... SELECT` with
   eligibility in its predicate (enrollment exists, not self-owned, status
   not pending/approved, no existing assignment); zero-row inserts map back
   to the precise 409/404. Test proves a review committed between check and
   insert blocks creation with no assignment row.
   No interleaving was found that current lower-level guards already
   prevented; every reproduced race above was real on pass-2 code.

## Verification (pass 3)

- Focused: the 5 new interleaving tests pass.
- Full Worker: **265 passed** (260 + 5). Frontend: **322 passed** + Auth.js
  fixtures (unchanged surface). TypeScript clean.
- `npm run build` passed (credential scan clean); then `npm run smoke`:
  16 routes, 36 assets, 31 checks, app budget untouched, no paid calls.
- Changed paths (pass 3):
  `services/learning/hashir/public-site/src/professional.mjs`,
  `services/learning/hashir/public-site/src/professional-evidence.mjs`,
  `services/learning/hashir/public-site/scripts/professional-test.mjs`,
  this file. Hobby behaviour, styles, and animations untouched.

---

# Fourth focused pass — 2026-11-02 (Professional course routes)

## Confirmed defect

Every Professional course card links to `/professional/course/<course.id>`
with canonical Worker catalogue IDs (`plumbing`, `electrical`, `carpentry`,
`maintenance`) plus `#lesson-<lesson.id>` anchors, but
`src/app/professional/course/[id]/page.tsx` generated only the invented
`plumbing-foundations` route and rendered mock plumbing lesson content.
Coordinator confirmed live HTTP 404 for all four canonical URLs. The green
suite never tested the card URLs.

## Fix

- The course page now generates routes from the actual catalogue
  (`services/learning/hashir/public-site/web/professional-catalogue.json`,
  imported directly so preview content cannot drift from the enforced
  course): all four canonical IDs plus `plumbing-foundations` as a legacy
  alias rendering the plumbing course. `dynamicParams=false`, awaited
  Next 16 params, unknown IDs 404 honestly.
- Each page renders the real course trade/level/content status/description/
  prerequisites and its actual two catalogue lessons, anchored at
  `lesson-<lesson_id>`, with every step's title, instructions, expected
  result and criteria. No invented trade content; the old mock
  "Join a fitting" lesson-two is gone.
- Scope and semantics kept honest: classroom/disconnected only, read-only
  preview, no instructor approval or trade qualification. The next action
  goes to the training hub (`/professional/lessons/`) to enrol behind its
  sign-in/classroom-confirmation gates; a preview never enrols implicitly.
  The plumbing page keeps the real free sample start, explicitly labelled
  as separate from enrolment.
- Duplicated back arrow fixed on the course page and the Professional
  sample overview (`← {s[...]}` where the string already contains `←`).

## Regression coverage

- New `tests/course-routes.test.tsx` (7 tests), derived from every catalogue
  course and lesson: static params cover all canonical IDs + alias; each
  rendered page contains its own course/lessons/step titles and
  `id="lesson-…"` anchors and no other course's lesson titles; alias renders
  plumbing; no `← ←`; enrolment copy and hub link present.
- Production build: `out/professional/course/{plumbing,electrical,carpentry,maintenance,plumbing-foundations}/index.html`
  all exist with the correct two lesson anchors; the electrical page
  contains no plumbing lesson content.
- Browser (Playwright/Chrome, local production preview, 390px + 1280px):
  from the training hub, each course's View-course link and second-lesson
  anchor link were clicked for all four courses — correct title and lesson
  render, hash target scrolls into view, no 404, no horizontal overflow.

## Verification (pass 4)

- Frontend: **329 passed** (322 + 7 new) in 23 files, plus Auth.js fixture
  checks, no real provider calls. TypeScript clean (checked with the
  targeted run).
- `npm run build` passed; credential scan 488 files clean. Post-build
  `npm run smoke`: 16 routes, 36 assets, 31 checks, app $5 budget
  untouched, no paid requests. Worker sources untouched this pass, so the
  Worker suite was not rerun (per instruction).
- Changed paths (pass 4):
  `src/app/professional/course/[id]/page.tsx`,
  `src/app/professional/lesson/sample/page.tsx`,
  `tests/course-routes.test.tsx`, this file.

---

# Bug hunt — 2026-11-02

Audited: internal hrefs/pushes against the generated static routes (no dead
targets beyond dynamic segments), synchronous Next params usages, dead
buttons in sample fixtures, and the three still-open items from the original
review (10, 11, 12). Four bugs found and fixed:

1. **LoopingWords ignored `prefers-reduced-motion`** (original finding 12):
   the hero word rotation ran a 2.2s interval unconditionally. It now uses
   `useReducedMotion()` and does not start the interval when reduced.
   (`src/components/lightswind/looping-words.tsx`)
2. **Instructor assignment controls mounted off the instructor desk**
   (finding 11): `InstructorAssignments` (which fetches assignment options
   on mount) rendered for admins on create/library views. Now gated on
   `view === "instructor"`. (`ProfessionalStudio.tsx`)
3. **Duplicate evidence fetches per criterion** (finding 10): every
   `CriterionEvidence` fetched the same enrollment evidence list.
   Simultaneous mounts now share one in-flight fetch per enrollment via a
   module-level promise cache that clears when settled.
   (`ProfessionalStudio.tsx`)
4. **Photo deleted before its database record** (same class as the pass-2
   evidence fix, two more instances): practice-submission history deletion
   (`sessions.mjs`) and professional-request photo deletion
   (`professional-requests.mjs`) deleted the blob first, so a failed DB
   update left a live record pointing at a deleted photo. Both now update
   the record first and delete the blob afterwards (orphan-on-failure is
   recoverable, a broken live record is not).

Looked for and not found: dead internal links (all literal targets resolve
to generated routes or dynamic lesson/course shells), other synchronous
`params`/`searchParams` reads in server pages, dead SampleFixture actions
(wired in pass 1/2).

Verification: frontend **329 passed** + Auth.js fixtures; Worker **265
passed** (Worker touched: `sessions.mjs`, `professional-requests.mjs`);
TypeScript clean; build passed, credential scan clean; post-build smoke
16 routes / 36 assets / 31 checks, no paid requests.

---

# Typed learning goal — 2026-11-02

Added a fourth create mode, **Type what you want to learn**, alongside (not
replacing) Tutorial link, Paste instructions and Free numbered steps. The
learner writes in their own words; the text is sent through the existing AI
lesson creation as `source_text` with the typed description as the learning
goal. Because AI can only ground checkpoints in what was actually written,
the mode requires ~100+ characters and explains that up front; short input
gets an inline message asking for more detail rather than a guaranteed
server rejection, and the existing free-numbered-steps fallback keeps the
typed words. Strings live under `topic.*` in `src/lib/strings.ts`; the
create panel changes are in `src/components/learning/Workspace.tsx`.

Coverage: new real-flow test in `tests/learning.test.tsx` proves the mode
renders, too-short input blocks with the detail message and sends nothing,
and a full description sends `processing_mode:"ai"` with the exact typed
`source_text`/derived `learning_goal`, then starts practice. Frontend
**330 passed** + Auth fixtures; build passed; smoke 16/36/31, $5 untouched.
Browser (Playwright, 390px, local production preview): all four modes
present, topic heading renders, long text types in, no horizontal overflow.

---

# Step images ready before advancing — 2026-11-02

Owner request: the target image should be generated before the learner
clicks next step. Previously the Next player only generated when the learner
pressed "Generate step image" on that step. Now, in
`src/components/learning/StepIllustration.tsx`:

- The current step's image auto-generates once when none is saved and the
  shared AI allowance is available (server claim keeps it a single
  purchase; failed generations are never silently retried, and the button
  remains for retry/unavailable states and is what renders when AI is off).
- `StepIllustrationPrefetch` silently generates the **next** step's image in
  the background while the learner works on the current one, writing it to
  the shared illustration cache used by the live camera target; it renders
  nothing, surfaces no errors, and never retries a failed job. The player
  mounts it for `lesson.steps[index + 1]` (`Workspace.tsx`).
- Sample lessons are unaffected (committed reference visuals, no AI spend);
  free self-review flows without AI availability still generate nothing.

New `tests/step-illustration.test.tsx` (4 tests) proves: auto-generation
happens with no click and exactly one POST; nothing generates when the
allowance is unavailable; prefetch saves the next step's image into the
shared cache with one POST; prefetch failure is silent and non-retrying.
Frontend **334 passed** + Auth fixtures; TypeScript clean; build passed;
smoke 16/36/31, $5 untouched, no paid calls in verification (all Meta calls
mocked).

---

# Supadata credit fallback — 2026-11-02

When the free Supadata allowance is exhausted (or the account is paid/
unrecognized, rate-limited, or misconfigured), a pasted **YouTube** link no
longer dead-ends. `youtubeCaptionFallback` in
`services/learning/hashir/public-site/src/sources.mjs` reads the video's own
public caption tracks keylessly: it fetches the watch page, picks the
English track (manual before auto-generated), downloads it as json3, and
stores the result as a normal `social_transcript` source with a limitation
note saying captions were read directly because the allowance is
unavailable. It runs both for fresh quota failures and for previously
stored failed extractions, never for visual-observation requests, and any
failure (private/consent-walled video, no captions, captions under 100
characters) returns null so the original quota error and the existing
paste-the-transcript path apply unchanged. Instagram/TikTok/etc. have no
keyless caption source and keep exactly that behaviour. No new service, no
paid plan, no API key involved.

Tests (`supadata-test.mjs`, 18 passed): exhausted account + public captions
produces a cached transcript source with zero Supadata calls beyond the
account check; exhausted account without captions keeps
`source_free_quota_exhausted`. Full verification: Worker **267 passed**,
frontend **334 passed** + Auth fixtures, TypeScript clean, build passed,
smoke 16/36/31 with no paid requests (all provider traffic mocked).

## Live acceptance (coordinator, not rerun)

Real YouTube transcript ingestion (aAxGTnVNJiE) returned 201 with an
8-step crochet lesson (`content_origin: social_transcript`, ~19s);
`/tmp/showonce-live-youtube-acceptance.json`. App ledger now US$0.206525
charged / US$4.793475 of US$5 remaining; total additional live spend across
Q&A, photo checks and ingestion US$0.01542. Physical-device and production
OAuth acceptance remain unverified/unconfigured.
