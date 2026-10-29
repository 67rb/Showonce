# Ownership and integration

## Confirmed requirements implemented here

Master owns backend setup, shared API documentation, persistent sessions, progress,
submission history, resume, duplicate prevention, photo storage and deletion,
usage tracking preparation, deployment preparation, and nightly integration.
Real tutorial extraction and AI assessment belong to Hashir. Frontend and learner
experience belong to Steven. Deva's testing role remains provisional.

## Proposed module boundaries

| Owner | Files/modules | Integration responsibility |
|---|---|---|
| Master | `backend/showonce/core.py`, `server.py`, API/operations docs, database | Server state, persistence, endpoint contracts |
| Hashir | Provider implementations; proposed new `backend/showonce/adapters/` directory | Link extraction and photo assessment, example inputs/outputs |
| Steven | Frontend directory of his choice; not created here | One API connection layer using documented endpoints |
| Deva, provisionally | `backend/tests/`, manual evidence and issue records | Reproducible cases and fix verification |

Agree ownership before concurrent edits. Hashir can implement adapters in separate
files while Master wires them into startup. Steven should avoid deriving progress
from local button clicks: render the server response instead.

## Independent daytime work

- Master: run backend tests and the HTTP demo using fake assessments.
- Hashir: instantiate provider classes directly with a sample step and image;
  deliver passing examples for pass/retry/uncertain, setup, and provider limits.
- Steven: connect to this API or mirror its documented fixtures in frontend mocks;
  use `mock_result` to exercise all feedback states and error UI.
- Deva: prepare images and expected cases before components arrive; confirm his
  stack, interests, and availability before assigning implementation work.

## Recommended nightly integration

1. Agree which component revisions will be combined and record contract changes.
2. Run backend tests and the HTTP demo.
3. Connect Steven's UI to the mock backend and complete the photo journey.
4. Swap in Hashir's adapters only when their contract examples work independently.
5. Exercise retry/uncertain, reload/resume, duplicate clicks, and provider failure.
6. Record reproducible issues with owner and expected result. Keep a working mock
   configuration for the following day's independent development.
7. Master deploys the reviewed build to the selected environment after the team
   selects hosting and completes the relevant operations prerequisites.

## Team decisions still open

- Final framework, transport, account authentication, and hosting.
- Confirmation of photo-first milestone and any schedule.
- Real providers, verified model input support, timeout limits, and budget controls.
- Supported tutorial sites, extraction rights/access, source-content retention.
- Trade content review rules and permitted safe practice exercises.
- Image retention period, backups, and deletion policy.
- Live video capture, streaming transport, latency target, and cost limits.

None of these decisions is implied by the runnable local mock backend.
