# Loading, progress and photo recovery improvements

27 October 2026. The established visual style and public audience are retained.

- Loading describes the action underway: AI generation, free numbered instructions, authored example, resume or new session. Only AI generation mentions a potentially billable request.
- Acknowledgement immediately displays a disabled Saving practice state. The same idempotency key is reused after an ambiguous lost response. Progress always comes from the server.
- Refresh saved progress reconnects the learner to the authoritative current checkpoint. Mobile screens have a labelled checkpoint chooser for read-ahead and review, with completion remaining sequential.
- History has in-place loading/errors and a closable private-photo viewer. Delayed history/image/delete replies are discarded after navigation or a session change. Completed photo checkpoints cannot be submitted for another check.
- Network and unreadable proxy errors explain how to recover without falsely claiming the server did no work. Finite request deadlines and ambiguous-response codes preserve safe same-request retries.
- Concurrent same-key acknowledgement requests both return success/replay and advance once.
- Photo storage references are durable before upload. Ambiguous upload errors attempt cleanup; failed cleanup retains a discoverable reference. Pending uploads cannot be deleted midway. A delayed ambiguous upload after lease expiry/deletion is reconciled, with regression coverage.

Validation: 49 JavaScript checks, 40 Hashir Python checks, 15 original backend Python checks (104 total); Worker artifact validation and Git whitespace checks. Local browser verification covers offline refresh/reconnect, saved acknowledgement, mobile navigation and read-ahead without advancement. No paid model calls are required or made for this change. Hardware camera and complete accessibility conformance remain outside verified coverage.

Run the JavaScript checks after assembling and building:

    node --test scripts/test.mjs scripts/frontend-test.mjs scripts/master-test.mjs scripts/public-api-test.mjs
