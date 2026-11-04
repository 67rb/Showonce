# ShowOnce video downloader (self-hosted yt-dlp)

Downloads a public social video as MP4 so the ShowOnce Worker can send that
file to the Meta Model API for video observation (`muse-spark-1.3` reads the
visual sequence and embedded audio). This separate host exists because:

- Meta accepts only MP4 (`video/mp4`), not a YouTube/social watch page —
  verified 2026-11-04: `input_video` with a YouTube URL returns HTTP 400
  `unsupported media type: text/html. Supported: MP4`.
- The Worker runtime can only fetch pages; extracting platform streams needs
  yt-dlp with a JavaScript runtime (YouTube signature/n challenges), ffmpeg
  merging, and frequent yt-dlp updates. That cannot run in the Worker.

## Contract

`POST /v1/video` with `Authorization: Bearer <DOWNLOADER_TOKEN>` and JSON
`{"url": "https://…"}` returns `200 video/mp4` with headers
`X-Video-Duration` (seconds) and `X-Video-Title-B64`. Errors are JSON
`{"error":{"code","message"}}`. `GET /health` is unauthenticated.

Chunked jobs (what the Worker uses): `POST /v1/jobs` downloads and splits the
video into ~`CHUNK_SECONDS` (default 300) MP4 segments with ffmpeg stream
copy, returning `{job_id, duration, title, chunks[{index, start_seconds,
duration_seconds, bytes, signed_path}]}`. `GET /v1/jobs/<id>/chunks/<index>`
returns one segment; `DELETE /v1/jobs/<id>` discards it. Jobs expire after
`JOB_TTL_SECONDS` (default 900).

Each `signed_path` carries an expiry and an HMAC-SHA256 signature (keyed by
the downloader token, which never appears in any URL). On a public HTTPS
deployment the Worker passes that URL to Meta as `input_video.video_url`, so
Meta fetches chunks directly — the Worker neither downloads the chunk bytes
nor uploads them to the Meta Files API. If Meta rejects a signed URL before
generation (unreachable/unsupported), the Worker falls back to downloading
that chunk and uploading it as a file; completed or ambiguous Meta responses
are never retried. On loopback/private deployments (no public HTTPS URL) the
upload path is used automatically. The Worker observes up to 5 chunks in
parallel ("agents") and merges observations with chunk-offset timestamps, so
wall time on long videos tracks the slowest batch instead of the full
duration, and each 5-minute window gets denser coverage than one long pass.
Parallelism does not reduce per-chunk quality: every agent gets the same
model, prompt, schema, output budget and budget reservation as a single
pass, and the merged observations must pass the same grounded validation
before any lesson is generated.

Bounds (env-overridable): `MAX_DURATION_SECONDS=3300` (55 minutes, matching
the app's Supadata video limit), `MAX_VIDEO_BYTES=200000000`, best MP4 at most
720p. Videos above 10 minutes are accepted; only videos over 55 minutes or
200 MB are rejected. Playlists, live streams, credential-bearing and
non-platform URLs are rejected. Downloaded files are deleted after each
response; nothing is stored or logged (request lines are not logged, so URLs
and tokens stay out of logs).

## Run / deploy

Any Docker host works (Fly.io, Render, a VPS, …):

```sh
docker build -t showonce-video-downloader services/video-downloader
docker run -p 8080:8080 -e DOWNLOADER_TOKEN=<long-random-secret> showonce-video-downloader
```

Put the host behind HTTPS. The Worker accepts an `http://` downloader URL only
for `localhost`/`127.0.0.1` local development.

Then configure the Worker runtime (same values the app already uses for Meta):

- `VIDEO_DOWNLOADER_URL=https://<your-downloader-host>`
- `VIDEO_DOWNLOADER_TOKEN=<same secret as above>`
- `MODEL_API_KEY=<Meta Model API key>` (existing)

With both downloader settings present, `learning_mode: "visual"` lesson
requests — and automatic upgrades from non-instructional transcripts — use
download-then-Meta-observation instead of Supadata video analysis. Results are
cached for one hour in `source_extractions` (`job_kind='meta_download'`);
failures are retained for that hour so a repeat request cannot start a second
download or a second paid Meta call.

## Cost and limits

Measured 2026-11-04 on `muse-spark-1.3`: a 60-second MP4 used 16,386 input
tokens (~273/sec). The Worker therefore reserves at 320 tokens/sec before the
Meta call: roughly $0.043/minute, so a full 55-minute video reserves about
$1.34 of the shared $5 public AI budget at the app's current internal rates
and settles to actual usage afterwards. A long video can therefore be refused
with a budget message when the remaining trial budget cannot cover its
up-front reservation — that is budget protection, not a duration rejection.
Uploaded Meta files are deleted immediately after inference.

## Operations

- yt-dlp is pinned in `requirements.txt`. YouTube changes break extractors
  regularly: bump the pin, rebuild, and redeploy when downloads start failing;
  there is no automatic paid fallback.
- The downloader token authenticates only the Worker. Rotate it by changing
  both the service env and the Worker setting together.
- Only download content you are permitted to process. Platform terms and
  copyright still apply to downloaded copies; the operator of this service is
  responsible for that compliance.
- Tests (mocked yt-dlp, no network): `python3 -m unittest test_server.py -v`
  from this directory with `yt-dlp` installed.
