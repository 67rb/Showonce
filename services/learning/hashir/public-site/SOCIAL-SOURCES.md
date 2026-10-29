# Social source integration — free-only preparation

The existing Worker now routes social sources through Supadata when explicitly
configured. No second backend or downloader host is introduced. Supadata gets
only the submitted public source URL. Server keys never enter browser assets,
source records, model prompts, error messages or commits.

## Activation

1. Create a **Free** Supadata account at https://dash.supadata.ai. A Meta Model API
   key cannot authenticate Supadata.
2. Save its API key in the ignored local `.env.supadata.local` file, or directly as
   the production runtime secret `SUPADATA_API_KEY`. Keep credentials out of chat.
3. Add `SUPADATA_ENABLED=free-only` as a production runtime setting and deploy the
   matching source version. Supadata calls stay disabled without both settings.
4. Verify `/me`: the app requires a plan named `Free` or `Free (100/mo)`, integer included credits
   between 1 and 100, and remaining credits. Unknown or paid plans are refused.
   The plan is checked before metadata retrieval and again before transcription.
5. Only after activation, run real URL acceptance tests. Automated fixture tests
   do not establish platform reliability or account entitlement.

Preparation used fixtures. During activation the supplied server-only key was
verified through `/me` as a free account with 100 included credits. Existing Meta lesson-generation allowance and reservations remain
separate. This integration does not authorize a paid Supadata plan or new Meta
spending. API error responses never trigger a paid fallback or auto-upgrade.

## Pipeline and contracts

Supported URL families: YouTube watch/share/Shorts/embed/completed live videos;
Instagram posts/reels/TV; TikTok video/photo/mobile/short links; X/Twitter status
links; Facebook reels/watch/share/posts/videos/group-permalink and fb.watch.
Profiles, feeds, unsupported URLs, credential-bearing URLs and non-HTTPS URLs
are rejected. Existing reviewed HTML tutorial sites keep their current extractor.

For social sources, the Worker checks the free account and retrieves public
metadata. Image/carousel/text posts use their actual captions. Video links submitted by the frontend default to direct audiovisual observation,
without a transcript request. They use the universal video extraction endpoint
and become labelled suggested practice plans. Unchecking "Learn by watching"
selects transcript-first mode; absent or non-instructional speech can still
upgrade automatically to visual observation.

- The canonical source URL keys a one-hour D1 cache in `source_extractions`.
- An atomic claim allows only one extraction start per cached URL. Simultaneous
  requests see its pending state; a completed source is reused.
- HTTP 202 transcript jobs retain their provider job IDs server-side. Browsers
  receive `{status:"source_processing",retry_after_ms:5000}`, poll the same lesson
  request, and only create a practice session after a lesson is returned.
- Both `POST /v1/lessons` and `POST /api/ingest` can now return HTTP 202. Existing
  clients should treat it as processing and retry the same input, rather than
  treating it as a lesson. The included frontend handles this contract.
- Polling slots have a three-second minimum interval. Transient polling failures
  retain known jobs. Uncertain starts are not automatically resubmitted. Leaving
  the UI stops browser polling and does not claim to cancel provider work.
- Upstream API requests have bounded deadlines and response sizes. Secrets are
  sent only to the fixed Supadata API origin with redirects disabled.
- Migration `0005_social_sources.sql` only adds the extraction cache. Readiness
  checks require it whenever extraction is enabled.

## Actual coverage limits

No service can guarantee every URL. Private, deleted, age-restricted, heavily
geoblocked or login-only sources can be inaccessible. Active live streams cannot
be transcribed. A reachable post may contain no teachable instructions.

Video analysis reads visible and audible actions without requiring speech. It is
not specific to an instrument, song, clip, or skill. The learner can optionally
state a goal. Suggested exercises are coach-generated and explicitly separate
from the observed evidence; the app does not claim a performer taught them.

Observation schema and local checks reject out-of-duration timestamps and
malformed data. Unreliable timelines are omitted. Claims about invisible internal
technique are excluded. Verified timestamp references link to the video only when
available. Exact notes, fingering, a score, precise tempo or hidden properties are
not fabricated. Musical checkpoints use listening/self-review instead of photos.
Image-only posts and carousel slides still use captions and are not automatically
interpreted as videos.

Sources longer than 30,000 characters still require a relevant shorter section.
Quota exhaustion pauses extraction; it never falls back to paid processing. The connected Free account has been verified and the video-analysis endpoint has
been exercised with a real performance. Platform availability and analysis quality
can vary; structural checks do not prove every observed fact is correct.

## Evidence and handoff

`node --test scripts/supadata-test.mjs` covers platform URL formats, all five
platform adapters, paid/unknown/exhausted accounts, a plan change before
transcription, concurrent starts, cache reuse, asynchronous resume, transient
poll failures, captions, silent sources, hostile redirects/job IDs, disabled
configuration and misuse of Meta keys. Browser workflow tests cover pending-job
polling and cancellation. No credential is present in these fixtures.

Official API references:
- https://docs.supadata.ai/get-transcript
- https://docs.supadata.ai/get-metadata
- https://docs.supadata.ai/api-reference/endpoint/account/me

## Visual learning API and migration

`POST /v1/lessons` and `/api/ingest` accept optional `learning_mode` (`visual` or
`auto`) and `learning_goal` (up to 300 characters). Visual mode bypasses transcript
retrieval for videos. Existing API callers default to `auto`; the included link
form selects `visual`. Both use the existing HTTP 202 saved-job polling contract.

A visual source has `content_origin=video_observations`. Generated lessons add
`lesson_type=demonstration_practice`, a coaching notice, and observation references
whose `kind=ai_video_observation`. Timestamps can be null; missing or unreliable
times produce no deep link. These are additive proposed API fields.

Schema-only migration `0006_video_demonstrations.sql` adds a provider job kind and
cached metadata. Existing rows retain transcript behavior. Video metadata is
fetched for legacy cached sources before a visual upgrade. Atomic claims prevent
simultaneous users from starting the same visual job; failed or uncertain jobs are
not automatically charged again. A duration-based estimate (5 free credits per
started minute) must fit the verified remaining free balance. No paid fallback is
enabled. Provider analysis currently supports complete public videos up to 55
minutes; the free allowance may impose a shorter practical limit.

Run `node --test scripts/demonstration-test.mjs` for visual-only multi-platform
coverage, non-musical examples, automatic upgrades, evidence validation, quota
checks, and the full Worker lesson path. Browser workflow fixtures cover the goal
field, default visual mode, evidence labels and timestamp-link suppression.
