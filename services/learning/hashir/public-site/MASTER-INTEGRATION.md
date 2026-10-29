# Master backend integration

The supplied `show-once-master-backend.zip` matches the existing root Python backend byte for byte. Its source is unchanged. The public host runs JavaScript Workers, not Python, so `src/sessions.mjs` implements the session contract on D1 and R2. This is a compatibility port, not a deployment of the Python process. `web/public-api.js` is the frontend connection layer.

The original backend's behavior is retained for photo sessions: private bearer access, one-time creation token, current-step enforcement, photo-only pass advancement, request idempotency, pending/assessed/failed submissions, private image retrieval/deletion, history, and per-submission usage. The model key remains server-only. Submitted outcomes cannot be selected by callers.

## HTTP endpoints

- `GET /health`: API v1 with `runtime: worker-d1`.
- `GET/POST /v1/lessons`, `GET /v1/lessons/{id}`.
- `POST /v1/sessions` with `lesson_id`; returns `access_token` once.
- `GET /v1/sessions/{id}` or `/progress`.
- `POST/GET /v1/sessions/{id}/submissions`.
- `GET /v1/sessions/{id}/usage`.
- `GET/DELETE /v1/sessions/{id}/submissions/{submission_id}/image`.

Every session resource requires `Authorization: Bearer <access_token>`. Photo POST requires `Idempotency-Key` and the original `step_id`, `mime_type`, `image_base64` body. A replay returns the same submission and current server progress. Photo pass advances progress when saved, before the user presses Continue. Retry/uncertain/failure never advances it.

## Explicit extensions and differences

- `POST /v1/sessions/{id}/acknowledgements` accepts `{step_id, observations?}` plus `Idempotency-Key` for intentional self-practice. It advances the current checkpoint and records `kind: self`; it never creates an assessment or an AI pass. It is forbidden while a photo assessment is pending. `observations` is an optional list of up to 20 learner-checked checkpoint details (1–300 characters each), stored with the acknowledgement and surfaced on its checkpoint. The original Python API does not yet expose this endpoint.
- Progress includes `completed_checkpoints` with `kind: photo|self`, alongside the original fields. Self checkpoints carry their stored `observations` array. The frontend uses server responses to derive counts, selected current checkpoint and completion. The frontend uses server responses to derive counts, selected current checkpoint and completion. Read-ahead screens are for review only. Starting again creates a new server session.
- Lesson POST also supports the existing `source_text`, `processing_mode`, and `example_id` inputs. Pasted lessons can have a null source URL. The public list exposes authored examples only; generated lessons are retrieved by opaque ID. Lessons are not account-private; avoid submitting confidential source material.
- Session tokens remain private capability credentials, not user accounts. The browser keeps the token locally for resume. Losing it loses access. Older device-only progress opens a new server session rather than being converted into AI-verified completion.
- Photos are stored in private R2 objects, up to 5 MiB each, at most 100 photo submissions per session. Only authenticated image endpoints expose them. History provides view/delete controls. Deletion removes the active object and reference, retaining feedback and progress; provider retention/backups are separate. Automatic expiry is not implemented.
- The Worker uses a durable 120-second processing lease instead of single-process startup recovery. Expired submissions become failed without re-calling the provider. D1 batch transactions protect completion/usage. A lost finalization response must be inspected or replayed with its original key. Unknown failure costs remain null; the shared provider reservation is retained conservatively.
- Camera checks require the existing sampled-photo endpoint's session ID, current step and bearer token. A durable per-session lease enforces one photo/camera request at a time and a three-second minimum between camera starts. Stale results after a step change or expired lease are rejected. They never save the frame or advance progress. Their costs are included in the global budget; the session usage endpoint contains saved photo submissions only.
- The original shared US$1 hosted AI allocation, reserved inside the user's US$5 total, remains unchanged. No new allowance is allocated by session creation, replay or acknowledgement.

## Verification

Run `node --test scripts/test.mjs scripts/frontend-test.mjs scripts/master-test.mjs` after assembling and building. The master tests cover access, sequential and idempotent acknowledgements, all three photo outcomes, replay/conflict, pending concurrency, history, usage, image privacy/deletion, provider failure and expired finalization recovery. `scripts/master-reference.json` was generated from the unchanged Python backend for pass/retry/uncertain progression and replay; the Worker tests compare those projections. Regenerate from the parent workspace with `python3 hashir/tools/master_contract_reference.py` when intentionally updating the reference contract.

All automated provider responses are controlled test doubles; test-only keys are not valid credentials. The existing root Python tests and Hashir tests continue to run separately. Real camera hardware and accuracy on learner photos remain unverified.

## Runtime reliability follow-up

Migration `0002_runtime_reliability.sql` preserves existing sessions and budget
totals while adding durable budget settlements and camera leases. `GET /health`
now verifies database/schema readiness and the presence of the media binding.
See SYSTEMS.md and `scripts/systems-test.mjs` for transaction, failure and
concurrency behavior. The standalone Python backend and proposed team contracts
remain separate from this Worker implementation.
