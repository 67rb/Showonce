# Show Once — combined Hobby and Professional app

One source project and one backend, with two learning modes:

- **Hobby** at `/`: personal projects and creative practice, using the supplied animated frontend.
- **Professional** at `/professional/`: trade-training briefs, courses, prerequisites, saved work evidence and instructor review. The latest reviewed Meta Wonder UI improvements are integrated.

This is a new combined working copy. The original app, delivered Desktop source and existing public site are unchanged. No deployment, GitHub push, real user data or credentials are included.

## Run locally

Node 24+ with built-in SQLite is required.

```sh
npm ci
npm run dev -- --learner-fixture
```

Open `http://127.0.0.1:8035/` for Hobby or `http://127.0.0.1:8035/professional/` for Professional. The mode switch moves between them. The default preview uses a separate port to coexist with earlier copies; `--port 8040` overrides it.

`--learner-fixture` is an explicit synthetic local identity, not real authentication. To test instructor access, stop the preview and run `npm run dev -- --admin-fixture`. Without either flag the preview is anonymous. The preview binds to loopback, strips incoming identity headers and never ships fixture sign-in into the Worker.

Fresh private local state is stored in this copy's `.local/professional/`. Do not use real learner information with developer fixtures. The source archive excludes that directory, previous account records, uploaded photos and budget ledgers.

## APIs and spending

The code includes the Meta and Supadata integrations, but this new local copy has **no provider keys** and paid AI is disabled. Free examples, saved briefs/evidence and course practice work without AI. Keep real keys in separate server runtime secrets. Never add them to source, frontend variables, screenshots or downloads.

The application retains one **$5 total** AI cap, with atomic reservations; the separate **$20 development ceiling** is not an application setting. Supadata remains free-only. No paid calls were needed for this integration.

The original public Hobby site's newer Supadata key and successful YouTube test are separate production configuration. They are not copied here, and this copy has no live hosting project ID. Configure a separate deployment and real hosted identity before production acceptance. Do not reset or overwrite the original site's ledger or bindings.

## Verification

```sh
npm test
node --test services/learning/hashir/public-site/scripts/*test.mjs
npm run build:professional
npm run smoke
```

Build after npm test because test preparation assembles an API-only Worker. `npm run dev` builds automatically before launching the persistent preview. `npm run dev:frontend` alone is frontend development with proxy expectations; use the main dev command for the integrated app.

The combined tests include both modes in one private account library, overlapping evidence saves with asynchronous database timing, idempotency conflicts, brief error states and direct brief/plan links. See `COMBINED-VERIFICATION.json` for final counts and `docs/combined-integration.md` for provenance and changes. Earlier reports remain historical records.

## Deploy on Vercel

The same Worker that powers local development runs on Vercel through a serverless
catch-all (`api/[...path].mjs`). It keeps the Worker's SQL unchanged and replaces
the Cloudflare D1/R2 bindings with a durable LibSQL (SQLite) database and a blob
table. `vercel.json` serves the static Next export (`out/`) and rewrites `/v1/*`,
`/health` and `/examples/*` to the function.

Required project environment variables:

- `TURSO_URL` – a LibSQL/Turso database URL (e.g. `libsql://<db>-<org>.turso.io`).
  Create a free database at https://turso.tech, then copy its URL here.
- `TURSO_AUTH_TOKEN` – the Turso auth token for that database.
- `MODEL_API_KEY` – optional; enables AI lesson generation, photo checks and
  questions. Without it the app runs in free mode (examples + self-guided steps).
- `SUPADATA_API_KEY` / `SUPADATA_ENABLED` – optional; enables social/source
  transcription. Leave `SUPADATA_ENABLED=free-only` for free plans.
- `ADMIN_EMAILS` – optional JSON array of admin emails for the catalogue/team area.

The schema is applied automatically on the first request; photo uploads are stored
durably in the same database. Local verification of this path (no Turso needed,
uses a temp file database):

```sh
npm run build:vercel                # build static pages and the explicitly ESM Worker
node scripts/vercel-migrations.mjs   # regenerate server/vercel-migrations.mjs after schema changes
node scripts/vercel-smoke.mjs        # end-to-end: config, health, lesson, session, bucket
node scripts/vercel-handler-test.mjs # actual Node handler, parsed bodies, photo bytes, identity boundary
```

## Professional limits

The four starter trade curricula are classroom/worksheet/disconnected practice foundations awaiting qualified instructor validation. Self-review or AI feedback cannot award a trade qualification or establish safety. Evidence is private until explicitly shared for instructor review. Physical Android/Chrome and iPhone/Safari acceptance and real hosted identity remain pending.
