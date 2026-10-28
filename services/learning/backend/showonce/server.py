import json
import logging
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from .core import ApiError, Backend


class Server(ThreadingHTTPServer):
    daemon_threads = True


class Handler(BaseHTTPRequestHandler):
    server_version = "ShowOnce/0.1"

    def log_message(self, format, *args):
        # Do not log request paths, bearer tokens or images.
        pass

    def respond(self, status, body=None, mime="application/json"):
        data = b"" if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        origin = self.headers.get("Origin")
        if origin in self.server.allowed_origins:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError(400, "invalid_body", "Invalid Content-Length.")
        if size <= 0:
            raise ApiError(400, "invalid_body", "A JSON object is required.")
        if size > 7_100_000:
            self.close_connection = True
            raise ApiError(413, "body_too_large", "Request exceeds upload limit.")
        if self.headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
            raise ApiError(415, "unsupported_content_type", "Use application/json.")
        try:
            value = json.loads(self.rfile.read(size))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "invalid_json", "Request body must be valid JSON.")
        if not isinstance(value, dict):
            raise ApiError(400, "invalid_body", "A JSON object is required.")
        return value

    def dispatch(self):
        try:
            self.connection.settimeout(30)
            backend = self.server.backend
            path = urlsplit(self.path).path.rstrip("/")
            method = self.command
            authorization = self.headers.get("Authorization", "")
            token = authorization[7:] if authorization.startswith("Bearer ") else ""
            if method == "OPTIONS":
                return self.respond(204)
            if method == "GET" and path == "/health":
                return self.respond(200, {"status": "ok", "api_version": "v1", "mock_mode": backend.mock_mode})
            if path == "/v1/lessons":
                if method == "GET":
                    return self.respond(200, {"lessons": backend.lessons()})
                if method == "POST":
                    return self.respond(201, backend.create_lesson(self.body()))
            match = re.fullmatch(r"/v1/lessons/([a-zA-Z0-9_-]+)", path)
            if match and method == "GET":
                return self.respond(200, backend.lesson(match[1]))
            if path == "/v1/sessions" and method == "POST":
                return self.respond(201, backend.create_session(self.body()))
            match = re.fullmatch(r"/v1/sessions/([a-zA-Z0-9_-]+)(?:/(progress|submissions|usage))?", path)
            if match:
                session_id, resource = match.groups()
                if method == "GET" and resource in (None, "progress"):
                    return self.respond(200, backend.progress(session_id, token))
                if resource == "submissions":
                    if method == "GET":
                        return self.respond(200, {"submissions": backend.history(session_id, token)})
                    if method == "POST":
                        result = backend.submit(session_id, token, self.body(), self.headers.get("Idempotency-Key"))
                        return self.respond(200 if result["replayed"] else 201, result)
                if resource == "usage" and method == "GET":
                    return self.respond(200, {"events": backend.usage(session_id, token)})
            match = re.fullmatch(r"/v1/sessions/([a-zA-Z0-9_-]+)/submissions/([a-zA-Z0-9_-]+)/image", path)
            if match:
                if method == "GET":
                    data, mime = backend.image(match[1], match[2], token)
                    return self.respond(200, data, mime)
                if method == "DELETE":
                    backend.image(match[1], match[2], token, delete=True)
                    return self.respond(204)
            raise ApiError(404, "route_not_found", "Route not found.")
        except ApiError as error:
            self.close_connection = True
            self.respond(error.status, {"error": {"code": error.code, "message": error.message, "retryable": error.retryable}})
        except Exception:
            self.close_connection = True
            logging.exception("Unhandled backend error")
            self.respond(500, {"error": {"code": "internal_error", "message": "An internal error occurred.", "retryable": True}})

    do_GET = dispatch
    do_POST = dispatch
    do_DELETE = dispatch
    do_OPTIONS = dispatch


def create_server(backend, host="127.0.0.1", port=8000):
    server = Server((host, port), Handler)
    server.backend = backend
    server.allowed_origins = set(filter(None, os.environ.get("SHOWONCE_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")))
    return server


def main():
    if os.environ.get("SHOWONCE_MOCK_MODE", "true").lower() != "true":
        raise SystemExit("Real providers are not configured. Integrate Hashir's adapters before disabling mock mode.")
    backend = Backend(os.environ.get("SHOWONCE_DB", "data/showonce.sqlite3"))
    backend.recover_interrupted()
    server = create_server(backend, os.environ.get("SHOWONCE_HOST", "127.0.0.1"), int(os.environ.get("SHOWONCE_PORT", "8000")))
    print(f"Show Once mock API listening on http://{server.server_address[0]}:{server.server_address[1]}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
