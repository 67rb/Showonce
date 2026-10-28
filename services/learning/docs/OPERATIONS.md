# Run, persistence, and deployment preparation

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SHOWONCE_HOST` | `127.0.0.1` | Listener address |
| `SHOWONCE_PORT` | `8000` | Listener port |
| `SHOWONCE_DB` | `data/showonce.sqlite3` | Persistent SQLite file |
| `SHOWONCE_MOCK_MODE` | `true` | Executable currently supports mock providers only |
| `SHOWONCE_CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated browser origins |

No keys are required for mock mode and it consumes no API credits. Keep future
provider credentials in server environment variables, never in frontend code.
The $300 Meta allocation is for in-app AI usage. This backend does not assume any
specific Meta endpoint, model, pricing, or input support. Nebius/NVIDIA integration
is also pending verification and Hashir's adapters.

## Local container recipe

From the repository root:

```sh
docker build -f backend/Dockerfile -t showonce-backend .
docker volume create showonce-data
docker run --rm -p 127.0.0.1:8000:8000 --mount source=showonce-data,target=/data showonce-backend
```

Docker availability/build was not verified in this workspace. The recipe is a
preparation artifact, not a deployed service. Mount persistent storage; container
filesystem loss otherwise loses sessions and images.

## Consistency and recovery

Use exactly one API process per database; HTTP requests run concurrently in
threads. SQLite WAL and `BEGIN IMMEDIATE` serialize session state mutations.
Uniqueness of `(session_id, idem_key)` prevents duplicate submission records.
One assessment per session may be in progress at a time. Provider work happens
outside the write transaction, so unrelated sessions can continue.

When the transaction saving an assessment fails, progress is rolled back and the
API returns 503 `finalization_failed`. An in-memory queue retries the failed-state
cleanup on later submission, progress, or history requests. Cleanup preserves
validated provider usage where available and never re-calls the provider. It is
idempotent: a successful cleanup records usage once. During an ongoing database
outage, reads/writes can still fail; recovery requires storage to become writable.

Startup marks interrupted `processing` submissions as `failed`; progress never
advances for those submissions. A request may have incurred external cost before
a crash, so reconcile provider billing before retrying costly real jobs. Recovery
must not run against a database served by another live process. A durable queue,
worker leases, migrations, and multi-instance deployment are future work.

## Storage and privacy

Session tokens are random, returned once, and stored as SHA-256 hashes. They grant
access to one session, its history, images, and usage. These are capability tokens,
not full user accounts. Use TLS outside local development. No session enumeration
endpoint exists, and request logging omits paths and authorization headers.

Images are BLOBs in SQLite. GET/DELETE require the owning session token. Deletion
removes active image records while retaining assessment/progress metadata. It does
not promise forensic erasure from database pages, WAL files, backups, process
memory, or AI provider retention. Agree retention and backup deletion before real
user data. No automatic image expiry has been implemented.

Validation checks decoded size, allowed MIME types, and file signatures. It is
not a complete image decoder or decompression-bomb detector. Before real provider
use, add full decode/dimension limits and normalization in an isolated image
pipeline. Never serve uploads as HTML or allow caller-selected filesystem paths.

## Usage records and real-provider work

`usage_events` records each assessment outcome, provider/model, reported token
counts, and estimated USD cost; the session usage endpoint exposes its own events.
Mock cost is zero. Unknown provider-failure cost remains null. Tutorial extraction
usage and live-video usage are not tracked yet because those real workflows do
not exist here. Estimated cost is not an invoice or an enforced spending cap.

Before using real credits: verify actual models/modalities, add extraction usage,
provider request IDs, budget reservations and limits shared across providers,
finite provider timeouts/retries, and billing reconciliation. Do not enable real
adapters while client-chosen mock results are still in use.

## Public deployment prerequisites

This standard-library HTTP server is for local integration. Before exposing it
publicly, choose a production serving layer/reverse proxy with TLS, request/time
limits, authentication/account policy, rate limits, and controlled session/lesson
creation. CORS is only a browser policy and does not replace access control.
Real URL retrieval needs SSRF defenses, redirect validation, supported-host rules,
response-size/time limits, and protection from private-network destinations.

The current lesson endpoints are public and unpaginated. Add access rules,
pagination, quotas, monitoring, and a reviewed image/data retention policy as the
product grows. Never interpret a trade-practice pass as a safety certificate.
