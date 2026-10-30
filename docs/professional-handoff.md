# Professional edition: frontend and backend handoff

## Product boundaries

This is a separate development copy. The user supplied the new visual frontend in Showonce-master (2).zip, matching GitHub commit 3f0917619f0331baa8cc6bfdfb43090082ea7d00. Its green design and animations now wrap the professional backend. Do not redesign or deploy the existing public Show Once site. No provider calls were needed to implement or verify this copy.

Professional starter curriculum lives in `services/learning/hashir/public-site/web/professional-catalogue.json`. Add courses and immutable lesson IDs there; treat changing existing lesson definitions as a new version/ID once real learner records exist. Validate all trade content with an instructor. Current starter content is clearly labelled as awaiting that validation.

## Screens and files

- `/professional/`: supplied animated professional landing. `/` retains the supplied Hobby face inside this copy.
- `/professional/lessons/`: catalogue, enrollment and course progress; `/courses/` redirects here.
- `/professional/create/`: actual goal, photo and link form, plus saved learning requests.
- `/professional/instructor/`: instructor queue, notes and decision form; `/instructor/` redirects here.
- `/professional/lesson/runtime/play/?lesson_id=…&session_id=…`: inherited working practice UI, with a Professional courses return link and an explicit training boundary.
- Root `src/components/professional/ProfessionalStudio.tsx`: actual form, requests, course library and instructor UI in the supplied design. React escapes user content.
- Root `src/components/professional/{CreateFlow,LessonFlow}.tsx`: connect the supplied route shells to real data. Sample progress, query-selected verdicts and fake processing have been removed.
- `web/professional.html`, `.css`, `.js`: previous plain scaffolding, retained only at `/professional-legacy/` for diagnostics.
- `src/professional.mjs`: server course and review rules.
- `drizzle/0012_professional_courses.sql`: append-only enrollment and review tables.
- `scripts/professional-local-store.mjs`: persistent local development SQLite and photo storage, never shipped into the Worker.

Paths above are relative to `services/learning/hashir/public-site/` except the existing React workspace at root `src/components/learning/Workspace.tsx`.

## API contract

All JSON responses and account-owned records use no-store caching. Mutations require same-origin Origin and application/json. Identity comes from hosting-controlled headers, never client body roles. Existing `X-ShowOnce-Account` protects against stale browser identity. Instructor access uses the existing server ADMIN_EMAILS allowlist.

| Method | Path | Input / result |
| --- | --- | --- |
| GET | `/v1/professional/courses` | Public course descriptors and ordered lesson summaries |
| GET | `/v1/professional/enrollments` | Current account’s enrollments, lesson progress, review history |
| POST | `/v1/professional/enrollments` | `{course_id, training_only:true}`; replay-safe enrollment per account/course |
| GET | `/v1/professional/enrollments/:id` | Owner’s current course detail |
| POST | `/v1/professional/enrollments/:id/start` | `{lesson_id}`; prerequisite-checked, replay-safe session and `href` |
| POST | `/v1/professional/enrollments/:id/request-review` | `{expected_version}`; all course practice must be complete |
| GET | `/v1/professional/review-queue` | Instructor only; up to 100 pending requests, excluding own work |
| POST | `/v1/professional/enrollments/:id/review` | Instructor only; `{expected_version, decision, notes}` |

Review decision is `changes_requested` or `instructor_approved`. A competing or stale write returns 409; reload rather than silently overwriting. Notes are required, at most 2,000 characters. Reviews are append-only and tied to the reviewed version. The learner can resubmit after requested changes; previous feedback remains visible. Instructors review the work directly before deciding; the queue currently shows course progress and notes, not a shared remote photo portfolio.

Practice checkpoints continue to use the existing `/v1/sessions/:id/acknowledgements`, photo history and `/api/assess` interfaces. Free self-review counts as **practice complete**, never instructor-approved. An AI match is likewise practice evidence, not a licence or certification. `qualification:false` remains explicit in course responses.

## Budgets and deployment separation

The copied runtime guard remains 5,000,000 micro-USD. No model key, user records or paid budget ledger were copied. Actual development uses mocks, static starter lessons and local SQLite; the separate $20 work ceiling is not a runtime setting. For any future publication, create a separate hosting project, identity configuration, D1 database, R2 bucket and runtime secrets. Never reuse the original production bindings. CI has no public-site smoke operation and does not deploy.

## Before professional rollout

- Instructor-validate and expand trade curricula, references, local requirements, prerequisites and real supervised practical assessments.
- Configure real instructor identities and validate the separate hosted sign-in/access setup.
- Test camera permission, focus, switching and uploads on physical Android/Chrome and iPhone/Safari.
- Verify live Meta feedback against instructor-approved examples before enabling paid AI in the new deployment.
- Complete course authoring and cohort administration as follow-on work. Learner evidence sharing is implemented: notes/photos stay private until the learner explicitly shares them for a review, sharing can be revoked (which blocks future reads but cannot retract downloads), and evidence is deleted by tombstone so replays cannot resurrect it (migration 0014, `professional-evidence.mjs`). The supplied visual frontend has now been integrated.

## Goal, photo and tutorial-link intake

The professional create screen starts with a learning-request form. Goal text is required (up to 300 characters), with structured brief fields — trade, experience level and target outcome (`success_criteria`) — plus an optional HTTPS tutorial link and PNG/JPEG/WebP work photo (up to 5 MiB). The structured fields persist with the request, bind its idempotency key, and are sent to the model as labelled learner data alongside the goal when a plan is explicitly requested. Preview is local; saving uploads the photo privately and persists all inputs without calling a provider. Saved input photos can be deleted independently of practice history.

- GET/POST `/v1/professional/requests`: list own latest 50 requests, or save `{goal,source_url,training_only:true,mime_type?,image_base64?}` with an `Idempotency-Key` header. Use the same key after an interrupted save; a changed payload with that key returns 409.
- GET `/v1/professional/requests/:id`: owner-only saved status.
- GET/DELETE `/v1/professional/requests/:id/photo`: private no-store photo retrieval or deletion; deletion waits while an AI request is processing.
- POST `/v1/professional/requests/:id/plan` with `{ai_consent:true}`: explicit paid action. Imports supplied tutorial content through the existing bounded source pipeline and sends it, the goal and actual saved image as separate text/image inputs to Meta. Imported links need the same supported source/provider setup as the main app. Pending imports can be checked by an explicit later retry, with no automatic AI polling or repeat generation.

The plan is labelled AI-suggested practice, not a verified curriculum or an exact tutorial quotation. Photo observations are labelled AI observations, with visible-evidence limits. Private lesson/session records connect directly to the existing questions, camera and photo practice tools. This does not award course enrollment completion or instructor approval. Ready plans replay without another model call; failed or processing attempts never automatically repeat. An interrupted processing attempt needs operator reconciliation rather than a fresh automatic charge.

Migration `0013_professional_requests.sql` is append-only. The local preview has no provider key: free input saving works, but AI generation is disabled until a separate server runtime is configured. Provider acceptance was tested with fixtures only, at no cost; no live Meta result is claimed.
