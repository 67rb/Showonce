# Show Once — multi-skill practice studio

Public app: https://showonce-practice-studio.jberry1972.chatgpt.site

Create source-grounded AI lessons from supported public HTML tutorials or pasted
instructions/transcripts for a range of skills. The interface uses the resulting
title, category, materials, step count, criteria and source passages. Free authored
examples cover origami, drawing, crochet and music. Free numbered-step mode
preserves supplied actions without a model call and labels checkpoints self-review.

The home practice library preserves multiple sessions and completed records in
this browser. Opening one refreshes progress from the server. Tutorial links,
pasted instructions and free numbered steps have separate drafts; free examples
can be searched and filtered by skill. See LIBRARY.md for migration, privacy and
storage-failure behavior.

This is a dependency-free Worker ESM Site. `web/` is the frontend, `src/core.mjs`
is the replaceable AI/source boundary, `src/routes.mjs` exposes the API, and D1
stores lessons, authenticated sessions, progress, submission history and an atomic shared US$5 public AI allowance. R2 holds private submitted photos. That allowance
was reserved within the user's existing US$5 local ledger; it is not extra credit.
The model key is a hosted runtime secret and is never present in source or assets.

Photo checks use Meta against the stored step context. Nonvisual checks need an
explicit self-acknowledgement; they are not counted as photo-supported passes.
Browser camera frames are sent only after the learner opens the camera and starts
feedback. Only one request is in flight per browser loop; step changes and Stop
invalidate results and stop media tracks. Hardware/permission paths require real
user-device validation. Saved photo submissions are stored privately in R2 and can be viewed/deleted through practice history; sampled camera frames are not stored.

Supported direct-fetch hosts are an exact allowlist: Origami.me, Instructables,
MDN, freeCodeCamp and Adafruit Learning. HTTPS only, validated redirects, streamed HTML up to 600 MiB,
a three-minute fetch deadline. YouTube and other inaccessible sources require pasted text;
the app does not claim arbitrary video extraction. AI steps require exact matching
source quotations. Unsafe or insufficient tutorial content can be refused.

Build and test from this directory:

    node scripts/assemble.mjs
    bash scripts/build.sh
    node scripts/validate-artifact.mjs
    node --test scripts/*test.mjs
    node scripts/deployment-smoke.mjs
    node scripts/preview.mjs

Local preview uses in-memory D1/R2-compatible adapters and NO provider key.
Hosted publishing uses the Sites source helper, preserves `.openai/hosting.json`,
and applies the schema-only Drizzle migration before serving the Worker. The old
static-export helper intentionally refuses to overwrite this Worker project.

The proposed AI contract is `hashir.ai.v2-proposed`. This public implementation
does not change Master's existing API v1 backend or Steven's production frontend.
The interface now uses server-owned API v1 session progress. Self-practice acknowledgements are an explicit extension and remain distinct from photo-supported passes. See MASTER-INTEGRATION.md for compatibility details and limits.

Server budget reservations, provider validation, camera concurrency and readiness
are documented in SYSTEMS.md. The runtime reliability update changes no files in
`web/` and retains the existing allowance and stored progress.

Account identity, cross-device libraries, the internal catalogue, learner reports
and release checks are documented in ACCOUNTS-CATALOGUE-REPORTS.md. Necessary new
controls retain the existing practice styling; `web/styles.css` is unchanged.
The team workspace is `/team.html`, restricted to the explicit `ADMIN_EMAILS`
runtime allowlist. Real-phone acceptance remains pending in DEVICE-ACCEPTANCE.md.
Local team-form QA uses `node scripts/preview.mjs --admin-fixture`, with synthetic
identity, disposable data and no model key. This fixture is never a hosted route.

## Social source processing (28 October 2026)

Instagram post/reel/TV links, TikTok video/photo links and vm/vt/t short links,
YouTube watch/Shorts/live/embed/youtu.be links, and X/Twitter status links are
recognized. Public descriptions, JSON-LD article bodies/captions and YouTube
embedded descriptions can ground lessons. Tracking parameters are removed.
Profiles, feeds, playlists and off-platform redirects are rejected. Existing
600 MiB streamed-download, three-minute fetch and 30,000-character extracted-text limits apply.

This extracts text, not video/audio or carousel images. Titles alone are
insufficient. Blocked/login-only posts or missing descriptions require pasted
instructions/transcripts. Generated lessons record this limitation; source-quote
checks still apply. Platform markup and access may change. No paid service or
credentials were added. Media transcription/frame extraction remains outstanding
for tutorials whose instructions are only spoken or shown. 

Run `node --test scripts/social-source-test.mjs` for social source fixtures.

### YouTube access-check recovery

YouTube share/Shorts/embed/live URLs are normalized to the canonical watch URL.
A valid social source that redirects to Google bot checks, consent, sign-in or
another inaccessible destination returns `transcript_required` without following
that destination. It is no longer reported as an unsupported input link.
The failed-link form offers a transcript field while preserving the original
link; submitted text is associated only with that link, and changing the link
cannot submit the previous transcript accidentally. Paste-instructions drafts
remain separate.

The reported `https://youtu.be/aAxGTnVNJiE` was tested against public YouTube:
a Google access-check redirect prevented extraction. This recovery does not
bypass platform restrictions or add automatic audio/video transcription.

## Automatic social transcription integration

See [SOCIAL-SOURCES.md](SOCIAL-SOURCES.md) for the prepared Supadata adapter,
free-only safeguards, asynchronous lesson API behavior, activation steps and
coverage limits. It requires the Supadata free-account runtime key and free-only activation setting;
a Meta key cannot enable it. Existing tests use fixtures, not live provider calls.

## Large source pages

Fetched HTML pages can now be up to **600 MiB (629,145,600 bytes)**. The response
is parsed incrementally in 64 KiB slices. Script/style/navigation/comment bodies
are discarded as they arrive; source tags and structured metadata use bounded
buffers. Social captions and YouTube descriptions can be found near the end of a
large page. Sources are not silently truncated to the first part of the download.

The fetch deadline is three minutes and lesson requests allow up to five minutes
for fetching plus generation. Both declared and actual streamed byte counts are
checked. Stalled or over-limit reads are cancelled. The existing 30,000-character
lesson-text limit and 5 MiB learner photo limit are separate and unchanged.

`node --test scripts/source-stream-test.mjs` includes a complete synthetic 600 MiB
page processed under a 64 MB JavaScript heap. It does not save or download a
600 MiB fixture file. It also covers split UTF-8, tags, entities, metadata,
comments, streaming overflow and cancellation. This size change does not enable
unconfigured transcription or bypass platform access restrictions.

## Learning by watching

Video links now default to **Learn by watching — no transcript needed**. The
processor observes actions and results in the video and the lesson generator
adds explicitly labelled suggested exercises for the observed skill. This is a
general path for public demonstrations and performances. An optional learning
goal helps focus the result; transcript-first mode remains available.

The app distinguishes AI observations from added coaching, omits unreliable
timestamps, and keeps music listening/rhythm checks in self-review. It does not
invent a score, exact notes, hidden physical technique or safety certification.
Video analysis consumes 5 included Supadata credits per started minute, subject
to the verified free balance. See SOCIAL-SOURCES.md for API and schema changes.

## Combined GitHub frontend

The current root landing, creation, library and player screens are the connected
Next frontend from 67rb/Showonce. `/studio` retains this earlier interface. Both
use the same account/session APIs, persisted practices, metadata and private photo
storage. Build the complete repository with `npm run build`; its static Next
export is embedded by `scripts/assemble.mjs --frontend <out-directory>`.
This integration preserves all migrations, provider settings and budget ledgers.
