# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
"""Local, loopback-only component demonstration; never a production frontend."""
import base64
import binascii
import json
import os
import secrets
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from .common import AIError, ROOT, VERSION, validate
from .ingestion import TutorialPipeline
from .assessment import PhotoAssessor
from .live import FrameProcessor


def decode(body):
    try:
        return base64.b64decode(body["image_base64"], validate=True)
    except (KeyError, TypeError, ValueError, binascii.Error):
        raise AIError("invalid_image", "Provide raw base64 image data.") from None


class DemoServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address=("127.0.0.1", 8011), *, provider=None):
        super().__init__(address, Handler)
        self.lesson = TutorialPipeline().process("https://origami.me/cup/")
        self.assessor = PhotoAssessor(provider, timeout=40 if provider else 20)
        self.preview_assessor = PhotoAssessor()
        self.token = secrets.token_urlsafe(32)
        self.live = None
        self.lock = threading.RLock()
        self.origin = f"http://127.0.0.1:{self.server_port}"

    def server_close(self):
        if self.live:
            self.live.close()
        self.assessor.close()
        self.preview_assessor.close()
        super().server_close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def respond(self, status, value, mime="application/json"):
        data = value if isinstance(value, bytes) else json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            size = 0
        if not 0 < size <= 7_100_000:
            raise AIError("body_too_large", "Provide a JSON body up to 7.1 MB.", status=413)
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            raise AIError("invalid_body", "Use application/json.")
        try:
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError()
            return body
        except (ValueError, UnicodeDecodeError):
            raise AIError("invalid_body", "Provide a valid JSON object.") from None

    def do_POST(self):
        try:
            self.connection.settimeout(25)
            # Token guards loopback mutations; no keys or provider configuration
            # are exposed. Origin/Host checks reject cross-site/browser rebinding.
            if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}" or self.headers.get("Origin") not in (None, self.server.origin) or self.headers.get("X-Demo-Token") != self.server.token:
                raise AIError("invalid_demo_access", "Reload the local demo before continuing.", status=403)
            body = self.body()
            path = urlsplit(self.path).path
            if path == "/api/ingest":
                validate("ingestion-request", body)
                return self.respond(200, TutorialPipeline().process(body["source_url"]))
            if path in ("/api/assess", "/api/preview/assess"):
                validate("assessment-request", body)
                # Demo uses server-owned lesson context; browser cannot change checks.
                step = next((s for s in self.server.lesson["steps"] if s["id"] == body["step"]["id"]), None)
                if step is None or body["lesson_id"] != self.server.lesson["id"] or body["step"] != step:
                    raise AIError("invalid_step", "Use the current demo lesson step.")
                assessor = self.server.preview_assessor if path == "/api/preview/assess" else self.server.assessor
                value = assessor.assess(submission_id=body["submission_id"], lesson_id=body["lesson_id"], step=step, image=decode(body), mime_type=body["mime_type"])
                return self.respond(200, value)
            with self.server.lock:
                if path == "/api/live/start":
                    step = next((s for s in self.server.lesson["steps"] if s["id"] == body.get("step_id")), None)
                    if not step:
                        raise AIError("invalid_step", "Select a valid lesson step.")
                    if self.server.live is None:
                        limits = {} if self.server.assessor.provider.is_mock else {"sample_interval": 3, "max_age": 20}
                        self.server.live = FrameProcessor(self.server.assessor, **limits)
                    self.server.live.start(session_id="local_demo", lesson_id=self.server.lesson["id"], step=step)
                    return self.respond(200, {"status": "started"})
                if path == "/api/live/stop":
                    if self.server.live:
                        self.server.live.stop()
                    return self.respond(200, {"status": "stopped"})
                if path == "/api/live/frame":
                    validate("frame-request", body)
                    if not self.server.live:
                        raise AIError("live_not_started", "Start the frame demo first.")
                    status = self.server.live.submit(session_id=body["session_id"], step_id=body["step_id"], frame_id=body["frame_id"], captured_at=body["captured_at"], image=decode(body), mime_type=body["mime_type"])
                    return self.respond(202, {"status": status})
                if path == "/api/live/events":
                    return self.respond(200, {"events": self.server.live.drain() if self.server.live else [], "metrics": self.server.live.metrics() if self.server.live else {}})
            raise AIError("route_not_found", "Demo route not found.", status=404)
        except AIError as error:
            self.close_connection = True
            self.respond(error.status, error.payload())
        except Exception:
            self.close_connection = True
            self.respond(500, {"error": {"code": "demo_failure", "message": "Local demonstration failed.", "retryable": True}})

    def do_GET(self):
        path = urlsplit(self.path).path
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            return self.respond(403, {"error": {"code": "invalid_host", "message": "Use the printed loopback URL.", "retryable": False}})
        if path == "/api/config":
            provider = self.server.assessor.provider
            return self.respond(200, {"token": self.server.token, "schema_version": VERSION, "lesson": self.server.lesson,
                "is_mock": provider.is_mock, "provider": provider.name,
                "budget": provider.budget.summary() if hasattr(provider, "budget") else None})
        assets = {"/": ("demo/index.html", "text/html; charset=utf-8"), "/app.js": ("demo/app.js", "text/javascript; charset=utf-8"), "/styles.css": ("demo/styles.css", "text/css; charset=utf-8")}
        if path in assets:
            file, mime = assets[path]
            return self.respond(200, (ROOT / file).read_bytes(), mime)
        # Explicit fixture inventory, no arbitrary filesystem routes.
        manifest = json.loads((ROOT / "fixtures/images.json").read_text())
        file = next((x["file"] for x in manifest if path == "/fixtures/" + x["file"]), None)
        if file:
            return self.respond(200, (ROOT / "fixtures" / file).read_bytes(), "image/png")
        self.respond(404, {"error": {"code": "route_not_found", "message": "Not found.", "retryable": False}})


def run(provider=None):
    server = DemoServer(("127.0.0.1", int(os.environ.get("SHOWONCE_HASHIR_PORT", "8011"))), provider=provider)
    print(f"Hashir's {server.assessor.provider.name} design/AI demo: {server.origin}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
