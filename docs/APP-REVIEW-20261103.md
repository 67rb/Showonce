# App review — 3 November 2026

Reviewed an isolated copy of GitHub master `7835efe9b85e30b282c2d4b93e37d62b01480b0e`.
The existing design, animation effects, API provider settings and US$5 runtime
allowance are preserved. All new regression checks use fixtures; no paid provider
requests were made for this review.

## Improvements

- Interior navigation stays accessible between phone and desktop widths. The
  mobile menu and desktop links now share one breakpoint; the Professional
  header fits at 320, 700, 1024 and 1440 pixels without horizontal overflow.
  Menus close on route changes, expose their controlled region, and return
  keyboard focus after Escape. Current-page links are identified for assistive
  technology. Landing navigation stays readable on hover.
- Professional 404 recovery stays in Professional, and the skip link targets
  the error page's main content.
- Selecting or discarding a camera still clears feedback, consent and queued
  bytes from the previous image. Reconnecting cannot submit a different image
  from the selected still.
- Question-history and deletion retries repeat the failed GET or DELETE rather
  than accidentally submitting a typed draft as a paid question.
- Hobby imports accept mobile YouTube links and validate exact HTTPS hosts,
  rejecting misleading hostnames and embedded credentials before submission.
- Professional drafts restore before persistence runs. Drafts are scoped to
  the current account, with regressions for switching accounts. Existing
  unscoped legacy drafts are retained untouched, but cannot safely be assigned
  to an account and are not automatically imported.
- Required preparation must be saved before opening assigned practice or
  submitting evidence. Optional checks are labelled and do not block submission.
- Assigned learners see the criterion-assessment workflow instead of an
  incompatible legacy review action. Evidence editing/deletion controls reflect
  submitted and approved assignment locks. Failed assignment loads surface an
  error instead of pretending no assignment exists.
- A successful evidence save clears the submitted form before refreshing. A
  later refresh failure therefore does not invite a duplicate save.
- Practice, training-request and evidence photo deletion immediately revoke
  access and explicitly report blob-storage failures. Authorized repeated
  deletes can finish cleanup; deleted evidence remains hidden. No background
  cleanup queue is added, so a storage failure still requires retrying DELETE.
- Health checks now verify the assignment/criterion schema instead of reporting
  ready when required migrations are absent.
- Source fingerprints exclude the generated Vercel Worker, matching the
  existing source-control boundary and allowing verification after a build.

## Verification

- Frontend: **355/355** tests, including **20 new regressions**.
- Worker: **274/274** tests, including **4 new regressions**; existing race and
  instructor-approval tests remain green.
- Authentication fixtures passed without real OAuth credentials.
- TypeScript passed; changed UI files introduce no additional lint errors or
  warnings compared with the baseline. Existing hook/image warnings remain.
- Vercel production build passed; credential scan checked **499 source/browser
  files** with no credential values found.
- Combined smoke: **16 routes, 38 Next assets, 31 API checks**, zero paid calls.
- Real Node handler fixtures passed with temporary SQLite: parsed forms/JSON,
  cookie handling, account isolation, instructor spoof rejection, and private
  session persistence.
- Chrome checked the built local app at 320/700/1024/1440 widths. The previously
  missing tablet menu works, Escape restores focus, and a typed Professional
  draft survives page reload. This is browser emulation, not phone acceptance.

## Remaining external checks

The live account endpoint still reports an unconfigured identity provider.
Production `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` and `AUTH_SECRET` must be set,
then real login, cross-device account saving and instructor review must be
accepted. See `docs/vercel-authentication.md`.

Physical Android/Chrome and iPhone/Safari camera/permission checks and qualified
instructor curriculum validation remain outstanding. Existing provider
acceptance evidence is historical; this review did not spend the AI allowance
to repeat live Meta calls.
