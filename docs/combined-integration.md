# Combined integration — 29 October 2026

## Source provenance

The reviewed Desktop delivery `ShowOnce-Professional-Work` was imported into a new combined project, retaining its integrated Hobby and Professional routes and shared backend. The imported ZIP SHA-256 is `05665610d649c9c19e90f917fc706bff1aeca54c0f20487e965ff1547ad2c323`. All 361 input members matched the Desktop folder before import. `SOURCE-MANIFEST-INPUT.json` describes that input, not the modified combined project.

The input already built on the latest Show Once professional copy, which included the Hobby frontend, camera, per-step questions, source/AI backend, SQL migrations and performance fixes. This integration retains that common runtime rather than duplicating two services or copying the original production state. Meta Wonder's Professional trade cards, navigation, corrected claims, course descriptions and brief summary are retained. Animation engine/source files are unchanged from the reviewed delivery.

## Integration repairs

- Evidence creation now handles the database uniqueness race atomically. If another request wins the same enrollment/save key, the loser rereads the durable record, verifies its payload hash and either replays the finished result or reports a specific in-progress conflict. It never starts a second active upload or returns an incidental database service failure for this race.
- Failed brief summaries are explicit. Ready plans open directly; drafts and failed attempts link to their own saved cards. Viewing a failed attempt never automatically repeats a paid call.
- Professional classroom notices and course-return links are now scoped to the Professional player; the shared workspace no longer leaks them into Hobby create/practice screens.
- The combined preview defaults to port 8035, and a supplied `--port` overrides it correctly. Its data remains inside this new project's excluded local state folder.
- Package metadata identifies the new combined application. A current source manifest and verification report accompany the combined ZIP; earlier reports are retained as historical input documentation.

Regression tests force both evidence requests to complete their missing-row read before either inserts, and hold the winner's photo upload while checking the loser. Separate tests check different payloads with the same key, and both modes sharing a private account library and the one $5 runtime cap without provider calls.

## Deployment boundary

This is a local integration, not a deployment. The existing public site, its newer Supadata key, live learner data, production bindings and ledger have not been changed. Provider keys are deliberately absent from the combined source and preview. Runtime integration code is included. Real identity/provider acceptance needs separate server configuration. The source cap remains $5; no development budget is added to it. Supadata stays free-only.

Physical-phone camera acceptance and curriculum validation remain external checks. Passing mocks, local SQLite tests and browser viewport checks is not evidence of those human/device requirements.
