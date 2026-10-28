# Runtime reliability — 28 October 2026

This change is confined to server code, database schema, checks and documentation.
All 20 files under `web/`, including the HTML, CSS, application and API client,
retain their exact pre-change SHA-256 hashes. No appearance or interface changes
are part of this delivery. Master's original Python backend remains unchanged.

## Durable budget control

The existing shared US$1 hosted allocation is retained inside the original US$5
allowance. Migration `0002_runtime_reliability.sql` adds a pause flag and a
reservation ledger; it does not reset the existing total, call count, sessions,
photos or earlier migration history. Older usage remains in the original total.

Reservation claim and aggregate charge run in one D1 batch. A nonce makes a
replayed claim inert. Settlement updates the refund and ledger status together,
conditional on an unsettled reservation, so concurrent replays or a lost database
reply cannot refund twice. A failed transaction retains the full reservation.
Invalid/missing usage, a provider outage, timeout or unreadable provider envelope
also retains the full reservation. There is no automatic model retry.

An observed usage overrun sets a persistent pause. Other in-flight settlements
cannot clear the pause or reopen the allowance. This fixes the reproduced race
where a normal late refund previously made new calls possible after an overrun.
No automatic unpause/reset endpoint exists. A real mismatch needs owner review.
The budget endpoint adds `paused` and `unresolved_reservations_usd`; its original
fields remain available. Provider billing is authoritative, and other consumers
of the same key remain outside this app's ledger.

D1 batches provide the transaction boundary described in the official
[Cloudflare D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).

## Validation and provider failures

Generated lesson and vision output receive local validation of the JSON Schema
subset used by the existing provider contracts: types, required fields, string
and array bounds, enum values and undeclared properties. Nested objects cannot
stand in for text observations, materials or evidence. Prototype property names
cannot bypass the undeclared-field check. Existing source-quotation matching,
criterion alignment and pass/retry/uncertain rules still apply.

Provider envelopes are read incrementally with a 150,000-byte cap and the existing
35-second request deadline. An inaccurate Content-Length cannot bypass the cap.
Oversized, stalled, interrupted, non-JSON and malformed responses are cancelled
or rejected with sanitized error codes. Invalid token preflight prevents a
generation request. Reported usage is settled even when the completed model
output fails validation; invalid output does not become an uncharged retry.
Bad source field types and unknown processing modes fail before AI work starts.
Photo and camera routes share the same image-signature and 5 MiB size checks.

## Server-owned camera scheduling

`POST /api/assess` requires a valid practice session and its bearer token, lesson
ID and authoritative current step. The existing browser client already supplies
these fields. The standalone Python frame processor remains a separate module.

A durable 120-second lease allows one camera request per session. Claims enforce
at least three seconds between starts, and an active photo check prevents a
camera claim. Photo submission also checks the camera lease atomically, so two
browser tabs cannot create overlapping paid photo/camera work for one session.
Independent sessions remain able to run concurrently. A failed request releases
its lease; a crash can be recovered after expiry. An old request cannot release
a newer lease.

Self-acknowledgement can still move to another checkpoint. A camera result is
returned only if the checkpoint and lease remain current when inference ends.
A late result receives `stale_feedback` and never advances progress. Camera
frames and their feedback are not stored by this change; the lease holds only
session/claim identifiers and timestamps. The global budget counts camera usage;
the session usage endpoint continues to describe saved photo submissions.

## Readiness and verification

`GET /health` now checks that the migrated budget and lease schema can be read
and the R2 binding is present. Missing bindings, schema or database service return
503 with sanitized errors. This is a database/binding readiness check; it does
not probe R2 availability with an object upload or call the AI provider.

Run the full suite after assembling and building:

    node scripts/assemble.mjs
    bash scripts/build.sh
    node scripts/validate-artifact.mjs
    node --test scripts/test.mjs scripts/frontend-test.mjs scripts/master-test.mjs scripts/public-api-test.mjs scripts/library-test.mjs scripts/workspace-test.mjs scripts/systems-test.mjs

The 28 new system tests exercise malformed contracts, body limits/deadlines,
reservation/settlement races and failures, additive migration from the earlier
schema, camera authentication/concurrency/staleness/cooldown/expiry, image
validation and readiness failures. They use controlled local provider responses
and SQLite D1-compatible transactions. No paid AI calls are required. Real camera
hardware and model accuracy are not established by these regression tests.

After publication, `node scripts/production-smoke.mjs <https-site-origin>`
checks readiness, fresh free-practice persistence and acknowledgement replay,
unauthorized/stale/invalid camera input rejection, unchanged budget totals and
four deployed interface asset hashes. It creates fresh synthetic practice records
without submitting a valid AI input. Session capabilities remain in process
memory and are excluded from the optional JSON report path supplied as a second
argument. Provider failure/race injection remains local to the test suite.

The hosted HTML comparison excludes only Cloudflare's identified inline
JavaScript Detection bootstrap; all application HTML must otherwise match, and
CSS/JavaScript are compared byte for byte. Cloudflare documents this injection
in its [JavaScript Detections guide](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/).
The check neither removes nor disables the hosted script for visitors.
