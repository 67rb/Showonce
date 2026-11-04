"""ShowOnce video downloader service.

Downloads a public social video (YouTube/Instagram/TikTok/X/Facebook) as MP4
with yt-dlp and returns the bytes to the ShowOnce Worker, which sends the file
to the Meta Model API for video observation. This host exists because the
Worker runtime can only fetch HTML and cannot extract platform video streams.

Endpoints (all /v1/* require `Authorization: Bearer <DOWNLOADER_TOKEN>`):
- POST /v1/video            -> one MP4 response (simple/legacy contract)
- POST /v1/jobs             -> download + split into ~CHUNK_SECONDS chunks,
                               returns {job_id, duration, title, chunks[]}
- GET  /v1/jobs/<id>/chunks/<index> -> one chunk MP4
- DELETE /v1/jobs/<id>      -> discard a job early (jobs also expire)
- GET  /health              -> unauthenticated liveness

Chunking lets the Worker observe segments in parallel, which shortens wall
time on long videos and gives denser observation coverage per segment.

Security/contract:
- Only HTTPS URLs on the supported platform hosts are accepted; credentials,
  playlists and live streams are rejected.
- Duration and file size are bounded before and after download. Downloaded
  files are deleted after the response or when the job expires.
- The service never logs the bearer token or request lines.

Run: DOWNLOADER_TOKEN=... python3 server.py  (see README.md / Dockerfile)
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import shutil
import subprocess
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import yt_dlp

TOKEN = os.environ.get("DOWNLOADER_TOKEN", "")
PORT = int(os.environ.get("PORT", "8080"))
MAX_DURATION_SECONDS = float(os.environ.get("MAX_DURATION_SECONDS", "3300"))
MAX_VIDEO_BYTES = int(os.environ.get("MAX_VIDEO_BYTES", str(200_000_000)))
CHUNK_SECONDS = int(os.environ.get("CHUNK_SECONDS", "300"))
JOB_TTL_SECONDS = int(os.environ.get("JOB_TTL_SECONDS", "900"))
JOBS_DIR = Path(tempfile.gettempdir()) / "showonce-downloader-jobs"

ALLOWED_HOSTS = {
    "youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be",
    "instagram.com", "www.instagram.com",
    "tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
    "x.com", "www.x.com", "mobile.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com",
    "facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch",
}

YDL_COMMON = {
    "quiet": True,
    "no_warnings": True,
    "noplaylist": True,
    # YouTube extraction currently requires a JS runtime for signature/n
    # challenges; the Docker image ships Node.js for this.
    "js_runtimes": {"node": {}},
    "remote_components": {"ejs:github"},
}

JOBS = {}


class DownloadError(Exception):
    def __init__(self, code, message, status):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


def validate_url(value):
    if not isinstance(value, str) or not value or len(value) > 2048:
        raise DownloadError("invalid_link", "Provide a tutorial URL up to 2,048 characters.", 422)
    parsed = urlparse(value.strip())
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port:
        raise DownloadError("invalid_link", "Provide a public HTTPS video URL without credentials.", 422)
    if parsed.hostname not in ALLOWED_HOSTS:
        raise DownloadError("unsupported_link", "This host is not a supported video platform.", 422)
    return value.strip()


def probe(url):
    with yt_dlp.YoutubeDL({**YDL_COMMON, "skip_download": True}) as ydl:
        info = ydl.extract_info(url, download=False)
    if not info or info.get("_type") == "playlist":
        raise DownloadError("source_not_video", "This link is not a single video.", 422)
    if info.get("is_live"):
        raise DownloadError("source_live", "Live streams cannot be processed. Use a completed video.", 422)
    duration = info.get("duration")
    if not isinstance(duration, (int, float)) or not duration or duration <= 0:
        raise DownloadError("source_duration_unknown", "The video duration could not be verified.", 422)
    if duration > MAX_DURATION_SECONDS:
        raise DownloadError(
            "source_video_duration",
            f"Video analysis needs a video of at most {int(MAX_DURATION_SECONDS // 60)} minutes.",
            422,
        )
    return {"duration": float(duration), "title": str(info.get("title") or "")[:500]}


def download_file(url, directory):
    options = {
        **YDL_COMMON,
        "outtmpl": str(Path(directory) / "video.%(ext)s"),
        "format": "best[ext=mp4][height<=720]/bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[height<=720]/best",
        "merge_output_format": "mp4",
        "max_filesize": MAX_VIDEO_BYTES,
    }
    with yt_dlp.YoutubeDL(options) as ydl:
        ydl.extract_info(url, download=True)
    files = [p for p in Path(directory).iterdir() if p.is_file()]
    if len(files) != 1:
        raise DownloadError("download_failed", "The video download did not produce one file.", 502)
    path = files[0]
    size = path.stat().st_size
    if size < 1024 or size > MAX_VIDEO_BYTES:
        raise DownloadError("source_too_large", f"The downloaded video exceeds the {MAX_VIDEO_BYTES // 1_000_000} MB limit.", 413)
    with path.open("rb") as handle:
        header = handle.read(8)
    if header[4:8] != b"ftyp":
        raise DownloadError("download_not_mp4", "The downloaded file is not an MP4 video.", 422)
    return path


def download(url, directory):
    return download_file(url, directory).read_bytes()


def fetch_video(url):
    url = validate_url(url)
    metadata = probe(url)
    with tempfile.TemporaryDirectory(prefix="showonce-video-") as directory:
        data = download(url, directory)
    return data, metadata


def _file_duration(path):
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
            capture_output=True, text=True, timeout=60, check=True)
        return float(json.loads(result.stdout)["format"]["duration"])
    except Exception:
        return None


def split_video(path, directory, chunk_seconds=CHUNK_SECONDS):
    """Split into ~chunk_seconds MP4 segments (stream copy, no re-encode).

    Returns [{index, start_seconds, duration_seconds, path, bytes}]. Falls
    back to the whole file as one chunk if splitting is unavailable.
    """
    directory = Path(directory)
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", str(path), "-f", "segment",
             "-segment_time", str(chunk_seconds), "-reset_timestamps", "1",
             "-c", "copy", str(directory / "chunk_%03d.mp4")],
            capture_output=True, timeout=900, check=True)
        files = sorted(directory.glob("chunk_*.mp4"))
    except Exception:
        files = []
    if not files:
        duration = _file_duration(path)
        return [{"index": 0, "start_seconds": 0.0, "duration_seconds": duration,
                 "path": Path(path), "bytes": Path(path).stat().st_size}]
    chunks, start = [], 0.0
    for index, file in enumerate(files):
        duration = _file_duration(file)
        chunks.append({"index": index, "start_seconds": round(start, 3),
                       "duration_seconds": duration, "path": file,
                       "bytes": file.stat().st_size})
        start += duration or 0.0
    return chunks


def chunk_signature(job_id, index, expires):
    """HMAC for a signed chunk URL. The token itself never appears in URLs."""
    message = f"{job_id}:{index}:{expires}".encode()
    return hmac.new(TOKEN.encode(), message, hashlib.sha256).hexdigest()


def valid_chunk_signature(job_id, index, expires, signature):
    try:
        expires = int(expires)
    except (TypeError, ValueError):
        return False
    if expires < time.time() or not isinstance(signature, str):
        return False
    return hmac.compare_digest(chunk_signature(job_id, index, expires), signature)


def _cleanup_expired_jobs():
    expired = [job_id for job_id, job in JOBS.items() if time.time() - job["created"] > JOB_TTL_SECONDS]
    for job_id in expired:
        shutil.rmtree(JOBS.pop(job_id)["directory"], ignore_errors=True)


def create_job(url):
    url = validate_url(url)
    metadata = probe(url)
    _cleanup_expired_jobs()
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    directory = Path(tempfile.mkdtemp(prefix="job-", dir=JOBS_DIR))
    try:
        path = download_file(url, directory)
        chunks_dir = directory / "chunks"
        chunks_dir.mkdir()
        chunks = split_video(path, chunks_dir)
        job_id = secrets.token_urlsafe(16)
        JOBS[job_id] = {"directory": directory, "created": time.time(), "chunks": chunks}
        expires = int(time.time()) + JOB_TTL_SECONDS
        return {"job_id": job_id, "duration": metadata["duration"], "title": metadata["title"],
                "chunks": [{**{key: chunk[key] for key in ("index", "start_seconds", "duration_seconds", "bytes")},
                            # Signed, expiring path so Meta can fetch the chunk
                            # directly without the bearer token (direct-URL
                            # handoff). The token itself is never in the URL.
                            "signed_path": f"/v1/jobs/{job_id}/chunks/{chunk['index']}?exp={expires}&sig={chunk_signature(job_id, chunk['index'], expires)}"}
                           for chunk in chunks]}
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        raise


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):  # Never log request lines (URLs/tokens stay out of logs).
        pass

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, error):
        return self._json(error.status, {"error": {"code": error.code, "message": error.message}})

    def _authorized(self):
        header = self.headers.get("Authorization", "")
        return bool(TOKEN) and header.startswith("Bearer ") and hmac.compare_digest(header[7:], TOKEN)

    def _require_auth(self):
        if not TOKEN:
            self._json(503, {"error": {"code": "service_unconfigured", "message": "Downloader token is not configured."}})
            return False
        if not self._authorized():
            self._json(401, {"error": {"code": "unauthorized", "message": "A valid downloader token is required."}})
            return False
        return True

    def _body_json(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length < 1 or length > 8192:
            raise DownloadError("invalid_body", "Request body must be a small JSON object.", 413)
        return json.loads(self.rfile.read(length))

    def _send_video(self, path, duration, title):
        data = Path(path).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Content-Length", str(len(data)))
        if duration is not None:
            self.send_header("X-Video-Duration", str(duration))
        self.send_header("X-Video-Title-B64", base64.b64encode(title.encode()).decode())
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            return self._json(200, {"status": "ok", "yt_dlp": yt_dlp.version.__version__})
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) == 5 and parts[:2] == ["v1", "jobs"] and parts[3] == "chunks":
            query = parse_qs(parsed.query)
            signed = "sig" in query or "exp" in query
            if signed:
                # Direct-URL handoff for Meta: a valid, unexpired signature
                # replaces the bearer token for this one chunk only.
                if not valid_chunk_signature(parts[2], parts[4], query.get("exp", [None])[0], query.get("sig", [None])[0]):
                    return self._json(401, {"error": {"code": "unauthorized", "message": "This signed video link is invalid or has expired."}})
            elif not self._require_auth():
                return
            job = JOBS.get(parts[2])
            if not job:
                return self._json(404, {"error": {"code": "job_not_found", "message": "This download job has expired. Start it again."}})
            try:
                chunk = job["chunks"][int(parts[4])]
            except (ValueError, IndexError):
                return self._json(404, {"error": {"code": "chunk_not_found", "message": "This video chunk is unavailable."}})
            return self._send_video(chunk["path"], chunk["duration_seconds"], "")
        return self._json(404, {"error": {"code": "not_found", "message": "Not found."}})

    def do_DELETE(self):
        parts = [p for p in self.path.split("/") if p]
        if len(parts) == 3 and parts[:2] == ["v1", "jobs"]:
            if not self._require_auth():
                return
            job = JOBS.pop(parts[2], None)
            if job:
                shutil.rmtree(job["directory"], ignore_errors=True)
            self.send_response(204)
            self.send_header("Content-Length", "0")
            return self.end_headers()
        return self._json(404, {"error": {"code": "not_found", "message": "Not found."}})

    def do_POST(self):
        if self.path not in ("/v1/video", "/v1/jobs"):
            return self._json(404, {"error": {"code": "not_found", "message": "Not found."}})
        if not self._require_auth():
            return
        try:
            payload = self._body_json()
            if self.path == "/v1/jobs":
                return self._json(201, create_job(payload.get("url")))
            data, metadata = fetch_video(payload.get("url"))
        except DownloadError as error:
            return self._error(error)
        except Exception:
            return self._json(502, {"error": {"code": "download_failed", "message": "The video could not be downloaded. It may be private, restricted or unavailable."}})
        self.send_response(200)
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Video-Duration", str(metadata["duration"]))
        self.send_header("X-Video-Title-B64", base64.b64encode(metadata["title"].encode()).decode())
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("DOWNLOADER_TOKEN must be set.")
    ThreadingHTTPServer((os.environ.get("DOWNLOADER_BIND", "0.0.0.0"), PORT), Handler).serve_forever()
