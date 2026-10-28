# Combined Show Once app

The root Next app is the frontend from `67rb/Showonce` and Showonce-master.zip.
Its landing design, sky/particle hero, typography, colors, navigation and component
system are retained. Product screens now read actual learning data instead of
sample lesson/progress fixtures.

`services/learning/` combines ShowOnce-Complete-Project.zip with the latest deployed
service source, including streamed sources, visual video learning, illustrations,
accounts, catalogue and reports. The original Master Python implementation remains
as the contract reference. Hashir's modules and compatibility port remain explicit
under `services/learning/hashir/`.

## Routes

- `/`: GitHub landing page.
- `/create/`: source links, learning goals, pasted text, free numbered steps and
  the published example catalogue.
- `/lessons/`: account or verified browser library, filters/search/pagination,
  resume and explicit attachment of earlier browser practices.
- `/lesson/runtime/?lesson_id=…&session_id=…`: actual lesson overview.
- `/lesson/runtime/play/?lesson_id=…&session_id=…`: server progress, photo checks,
  self-review, history, reports, target illustrations and camera open/switch/stop.
- `/team.html`: existing allowlisted catalogue and report queue.
- `/studio`: earlier working practice interface for compatibility.
- `/design/`: separate design reference, never the source of learner progress.

The runtime page is a static shell. URLs contain identifiers, never capabilities.
Private lesson/progress data is fetched after account verification. Account-owned
practices do not write browser capability snapshots. Older browser access uses the
same verified storage format in both interfaces. Account changes hide prior work
and discard stale responses; backgrounding stops the camera and rechecks identity.

## Hosting

Next exports pages/assets, assembled with the existing Worker and same-origin
`/api/*` and `/v1/*`. Database, bucket, Sites identity, audience, secrets and budget
are preserved. Managed sign-in/recovery belongs to Sites dispatch. The loopback
preview has no production authentication bypass route or model key.

Only static Next pages receive the CSP required for generated inline hydration
scripts/styles; the earlier interface retains its policy. Camera access is limited
to the same origin. No key, runtime database or learner photo is copied into source
or the downloadable project. New illustrations require a deliberate button press
and are labelled AI-generated. Submitted photos remain privately stored and
removable; camera frames are not saved. Landing privacy copy now matches this.

The configured source adapter, asynchronous extraction, video observation,
streamed large-page handling, grounding, durable budget, immutable publication
revisions and illustration quality gate are retained. Restricted/private sources
may still require pasted instructions; not every video can be read automatically.

## Verification

Retained design/component regressions still run. Obsolete assertions requiring a
fixed sample step 2 of 4, fake verdicts or mock error query strings are preserved
in docs/superseded-scaffold-tests.md. tests/learning.test.tsx instead drives the
real Worker: creation, account storage/isolation, library, access denial, image
validation, lost-response duplicate protection and report persistence.

`npm run smoke` checks seven combined routes and their Next assets, then runs the
31-request API/deployment smoke with no paid calls. Physical phone, sign-in and
recovery acceptance remain separate human checks in DEVICE-ACCEPTANCE.md.

## October performance and control polish

The public frontend now uses native scrolling, a single still cloud canvas sized
to its container, real text for its heading, and a native link for the primary
action. Capability cards stay still and appear once. Form backgrounds use a
quiet CSS gradient. Navigation no longer morphs its width while scrolling; the
mobile toggle has an accessible name, expanded state, and Escape handling.
Practice actions have consistent minimum touch sizes and wrap on narrow screens.
Public configuration and the initial account check load concurrently; identity
validation and account-change invalidation remain in place.

`tests/performance-controls.test.tsx` exercises menu behavior, destinations,
keyboard focus, readable heading/CTA without canvases, and unique gallery links.
Old tests that mandated particle physics, a three-canvas button, a moving
marquee, and morphing navbar were replaced or updated for this release.
