# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
import base64
import binascii
import hashlib
import hmac
import json
import math
import os
import secrets
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from urllib.parse import urlsplit

from .providers import MockAssessmentProvider, MockTutorialProvider


def now():
    return datetime.now(timezone.utc).isoformat()


def identifier(prefix):
    return prefix + "_" + uuid.uuid4().hex


class ApiError(Exception):
    def __init__(self, status, code, message, retryable=False):
        self.status, self.code, self.message, self.retryable = status, code, message, retryable
        super().__init__(message)


class Backend:
    def __init__(self, path, *, tutorial_provider=None, assessment_provider=None, mock_mode=True):
        self.path = str(path)
        self.mock_mode = mock_mode
        # Single-process recovery queue; startup recovery covers process restarts.
        self._failed_finalizations = {}
        self._recovery_lock = threading.Lock()
        if not mock_mode and (tutorial_provider is None or assessment_provider is None):
            raise ValueError("Real mode requires explicit tutorial and assessment providers")
        self.tutorial_provider = tutorial_provider or MockTutorialProvider()
        self.assessment_provider = assessment_provider or MockAssessmentProvider()
        os.makedirs(os.path.dirname(os.path.abspath(self.path)), exist_ok=True)
        with self.db() as db:
            db.executescript('''
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS sessions(
                    id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id),
                    token_hash TEXT NOT NULL, current_index INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS submissions(
                    id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
                    step_id TEXT NOT NULL, idem_key TEXT NOT NULL, request_hash TEXT NOT NULL,
                    status TEXT NOT NULL, assessment TEXT, created_at TEXT NOT NULL,
                    UNIQUE(session_id, idem_key));
                CREATE TABLE IF NOT EXISTS images(
                    submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
                    mime_type TEXT NOT NULL, data BLOB NOT NULL);
                CREATE TABLE IF NOT EXISTS usage_events(
                    id TEXT PRIMARY KEY, session_id TEXT, submission_id TEXT,
                    provider TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL,
                    estimated_cost_usd REAL, input_tokens INTEGER, output_tokens INTEGER,
                    created_at TEXT NOT NULL);
            ''')
            lesson = self.tutorial_provider.process("https://example.com/sample-paper-fold") if mock_mode else None
            if lesson:
                lesson.update(id="lesson_sample_origami", safety_notice="Practice feedback is not certification of safety.")
                db.execute("INSERT OR IGNORE INTO lessons VALUES (?, ?)", (lesson["id"], json.dumps(lesson)))

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def lesson(self, lesson_id):
        with self.db() as db:
            row = db.execute("SELECT data FROM lessons WHERE id=?", (lesson_id,)).fetchone()
            if not row:
                raise ApiError(404, "lesson_not_found", "Lesson not found.")
            return json.loads(row["data"])

    def lessons(self):
        with self.db() as db:
            return [json.loads(row["data"]) for row in db.execute("SELECT data FROM lessons ORDER BY id")]

    def create_lesson(self, body):
        url = body.get("source_url")
        try:
            parsed = urlsplit(url) if isinstance(url, str) and len(url) <= 2048 else None
            valid = parsed and parsed.scheme in ("http", "https") and parsed.hostname and not parsed.username and not parsed.password
        except ValueError:
            valid = False
        if not valid:
            raise ApiError(422, "unsupported_link", "Provide an HTTP or HTTPS tutorial URL without credentials.")
        # Mock does not fetch URLs. Real adapters must enforce SSRF and supported-source policies.
        data = self.tutorial_provider.process(url)
        if not isinstance(data, dict):
            raise ApiError(502, "invalid_lesson", "Tutorial provider returned an invalid lesson.")
        # The submitted URL is authoritative, even if the provider omits or changes it.
        data = dict(data, source_url=url)
        self.validate_lesson(data)
        data = dict(data, id=identifier("lesson"), safety_notice="Practice feedback is not certification of safety.")
        with self.db() as db:
            db.execute("INSERT INTO lessons VALUES (?, ?)", (data["id"], json.dumps(data)))
        return data

    @staticmethod
    def text_list(value):
        return isinstance(value, list) and all(isinstance(item, str) and item.strip() for item in value)

    @staticmethod
    def validate_lesson(data):
        steps = data.get("steps") if isinstance(data, dict) else None
        if not steps or not isinstance(steps, list) or len(steps) > 100:
            raise ApiError(502, "invalid_lesson", "Tutorial provider returned invalid steps.")
        if not all(isinstance(data.get(k), str) and data[k] for k in ("title", "category", "content_origin", "source_url")) or not Backend.text_list(data.get("practice_restrictions")):
            raise ApiError(502, "invalid_lesson", "Tutorial provider returned invalid lesson metadata.")
        ids = set()
        for position, step in enumerate(steps, 1):
            if not isinstance(step, dict) or not isinstance(step.get("id"), str) or not step["id"] or step["id"] in ids or step.get("position") != position or not all(isinstance(step.get(k), str) and step[k] for k in ("instructions", "expected_visual_result")) or not Backend.text_list(step.get("assessment_criteria")):
                raise ApiError(502, "invalid_lesson", "Tutorial provider returned invalid step fields.")
            ids.add(step["id"])

    def create_session(self, body):
        lesson_id = body.get("lesson_id")
        if not isinstance(lesson_id, str):
            raise ApiError(422, "invalid_lesson_id", "lesson_id must be a string.")
        self.lesson(lesson_id)
        session_id, token = identifier("session"), secrets.token_urlsafe(32)
        timestamp = now()
        with self.db() as db:
            db.execute("INSERT INTO sessions VALUES (?, ?, ?, 0, ?, ?)",
                       (session_id, lesson_id, self.token_hash(token), timestamp, timestamp))
        return dict(self.progress(session_id, token), access_token=token)

    @staticmethod
    def token_hash(token):
        return hashlib.sha256(token.encode()).hexdigest()

    def authorize(self, db, session_id, token):
        row = db.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not row or not isinstance(token, str) or not token or not hmac.compare_digest(row["token_hash"], self.token_hash(token)):
            raise ApiError(401, "invalid_session_access", "A valid session bearer token is required.")
        return row

    def progress_data(self, db, session):
        lesson = json.loads(db.execute("SELECT data FROM lessons WHERE id=?", (session["lesson_id"],)).fetchone()["data"])
        steps, index = lesson["steps"], session["current_index"]
        return {"session_id": session["id"], "lesson_id": session["lesson_id"],
                "status": "completed" if index >= len(steps) else "active",
                "current_step_id": steps[index]["id"] if index < len(steps) else None,
                "completed_step_ids": [s["id"] for s in steps[:index]], "total_steps": len(steps),
                "updated_at": session["updated_at"]}

    def progress(self, session_id, token):
        self.recover_failed_finalizations()
        with self.db() as db:
            return self.progress_data(db, self.authorize(db, session_id, token))

    @staticmethod
    def submission_data(row):
        return {k: row[k] for k in ("id", "session_id", "step_id", "status", "created_at")} | {
            "assessment": json.loads(row["assessment"]) if row["assessment"] else None}

    def history(self, session_id, token):
        self.recover_failed_finalizations()
        with self.db() as db:
            self.authorize(db, session_id, token)
            return [self.submission_data(r) for r in db.execute("SELECT * FROM submissions WHERE session_id=? ORDER BY created_at, id", (session_id,))]

    @staticmethod
    def decode_image(body):
        encoded, mime = body.get("image_base64"), body.get("mime_type")
        if mime not in ("image/png", "image/jpeg", "image/webp") or not isinstance(encoded, str):
            raise ApiError(422, "invalid_image", "Supply base64 PNG, JPEG or WebP data and mime_type.")
        if len(encoded) > 7_000_000:
            raise ApiError(413, "image_too_large", "Image limit is 5 MiB.")
        try:
            image = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error):
            raise ApiError(422, "invalid_image", "Image data is not valid base64.")
        if len(image) > 5 * 1024 * 1024:
            raise ApiError(413, "image_too_large", "Image limit is 5 MiB.")
        signatures = {"image/png": image.startswith(b"\x89PNG\r\n\x1a\n"),
                      "image/jpeg": image.startswith(b"\xff\xd8\xff"),
                      "image/webp": image[:4] == b"RIFF" and image[8:12] == b"WEBP"}
        if not signatures[mime]:
            raise ApiError(422, "invalid_image", "Image signature does not match mime_type.")
        return image, mime

    def submit(self, session_id, token, body, idem_key):
        self.recover_failed_finalizations()
        with self.db() as db:
            self.authorize(db, session_id, token)
        if not isinstance(idem_key, str) or not 1 <= len(idem_key) <= 128:
            raise ApiError(422, "invalid_idempotency_key", "Idempotency-Key must contain 1–128 characters.")
        step_id = body.get("step_id")
        if not isinstance(step_id, str):
            raise ApiError(422, "invalid_step", "step_id must be a string.")
        scenario = body.get("mock_result", "uncertain")
        if (not self.mock_mode and "mock_result" in body) or scenario not in ("pass", "retry", "uncertain"):
            raise ApiError(422, "invalid_mock_result", "mock_result is available only in mock mode: pass, retry, uncertain.")
        image, mime = self.decode_image(body)
        digest = hashlib.sha256(json.dumps([step_id, mime, scenario]).encode() + image).hexdigest()
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            session = self.authorize(db, session_id, token)
            previous = db.execute("SELECT * FROM submissions WHERE session_id=? AND idem_key=?", (session_id, idem_key)).fetchone()
            if previous:
                if previous["request_hash"] != digest:
                    raise ApiError(409, "idempotency_conflict", "This key was already used for different submission content.")
                return {"submission": self.submission_data(previous), "progress": self.progress_data(db, session), "replayed": True}
            progress = self.progress_data(db, session)
            if progress["current_step_id"] != step_id:
                raise ApiError(409, "step_not_current", "Submit only for the session's current step.")
            pending = db.execute("SELECT 1 FROM submissions WHERE session_id=? AND status='processing'", (session_id,)).fetchone()
            if pending:
                raise ApiError(409, "assessment_in_progress", "An assessment is already in progress for this session.", True)
            lesson = json.loads(db.execute("SELECT data FROM lessons WHERE id=?", (session["lesson_id"],)).fetchone()["data"])
            step = lesson["steps"][session["current_index"]]
            submission_id = identifier("sub")
            db.execute("INSERT INTO submissions VALUES (?, ?, ?, ?, ?, 'processing', NULL, ?)", (submission_id, session_id, step_id, idem_key, digest, now()))
            db.execute("INSERT INTO images VALUES (?, ?, ?)", (submission_id, mime, image))
        # Provider work is outside the write transaction, so other sessions remain usable.
        try:
            assessment = self.assessment_provider.assess(image=image, mime_type=mime, step=step, scenario=scenario)
            if not isinstance(assessment, dict) or assessment.get("result") not in ("pass", "retry", "uncertain") or not isinstance(assessment.get("feedback"), str) or not isinstance(assessment.get("corrections"), list):
                raise ValueError("Invalid assessment contract")
            if not all(isinstance(item, str) for item in assessment["corrections"]):
                raise ValueError("Corrections must be strings")
            if not all(isinstance(assessment.get(k), str) and assessment[k] for k in ("provider", "model")):
                raise ValueError("Provider and model are required")
            usage = assessment.get("usage")
            if not isinstance(usage, dict):
                raise ValueError("Usage must be an object")
            cost = usage.get("estimated_cost_usd")
            if cost is not None and (isinstance(cost, bool) or not isinstance(cost, (int, float)) or not math.isfinite(cost) or cost < 0):
                raise ValueError("Invalid estimated cost")
            for field in ("input_tokens", "output_tokens"):
                count = usage.get(field)
                if count is not None and (type(count) is not int or not 0 <= count <= 2**63 - 1):
                    raise ValueError("Invalid token usage")
            json.dumps(assessment, allow_nan=False)
        except Exception:
            self.queue_failed_finalization(submission_id, session_id, {})
            raise ApiError(502, "assessment_failed", "Assessment failed. Submit again with a new idempotency key.", True)
        try:
            with self.db() as db:
                db.execute("BEGIN IMMEDIATE")
                session = self.authorize(db, session_id, token)
                db.execute("UPDATE submissions SET status='assessed', assessment=? WHERE id=? AND status='processing'", (json.dumps(assessment), submission_id))
                if assessment["result"] == "pass":
                    db.execute("UPDATE sessions SET current_index=current_index+1, updated_at=? WHERE id=? AND current_index=?", (now(), session_id, session["current_index"]))
                self.record_usage(db, session_id, submission_id, assessment, "succeeded")
                session = self.authorize(db, session_id, token)
                row = db.execute("SELECT * FROM submissions WHERE id=?", (submission_id,)).fetchone()
                return {"submission": self.submission_data(row), "progress": self.progress_data(db, session), "replayed": False}
        except sqlite3.Error as error:
            self.queue_failed_finalization(submission_id, session_id, assessment)
            raise ApiError(503, "finalization_failed", "Could not save the assessment. Check submission history before retrying with a new key.", True) from error

    def queue_failed_finalization(self, submission_id, session_id, assessment):
        with self._recovery_lock:
            self._failed_finalizations[submission_id] = (session_id, assessment)
        self.recover_failed_finalizations()

    def recover_failed_finalizations(self):
        """Retry cleanup after storage recovers, without re-calling the provider."""
        with self._recovery_lock:
            for submission_id, (session_id, assessment) in list(self._failed_finalizations.items()):
                try:
                    with self.db() as db:
                        db.execute("BEGIN IMMEDIATE")
                        updated = db.execute("UPDATE submissions SET status='failed' WHERE id=? AND status='processing'", (submission_id,))
                        if updated.rowcount:
                            self.record_usage(db, session_id, submission_id, assessment, "failed")
                    del self._failed_finalizations[submission_id]
                except sqlite3.Error:
                    # Keep queued until a later state request, or startup recovery.
                    return

    @staticmethod
    def record_usage(db, session_id, submission_id, assessment, status):
        usage = assessment.get("usage") or {}
        db.execute("INSERT INTO usage_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (identifier("usage"), session_id, submission_id, assessment.get("provider", "unknown"),
                    assessment.get("model", "unknown"), status, usage.get("estimated_cost_usd"),
                    usage.get("input_tokens"), usage.get("output_tokens"), now()))

    def usage(self, session_id, token):
        with self.db() as db:
            self.authorize(db, session_id, token)
            return [dict(r) for r in db.execute("SELECT * FROM usage_events WHERE session_id=? ORDER BY created_at", (session_id,))]

    def image(self, session_id, submission_id, token, delete=False):
        with self.db() as db:
            self.authorize(db, session_id, token)
            row = db.execute("SELECT i.* FROM images i JOIN submissions s ON s.id=i.submission_id WHERE s.session_id=? AND s.id=?", (session_id, submission_id)).fetchone()
            if delete:
                db.execute("DELETE FROM images WHERE submission_id IN (SELECT id FROM submissions WHERE session_id=? AND id=?)", (session_id, submission_id))
                return None
            if not row:
                raise ApiError(404, "image_not_found", "Image not found or deleted.")
            return row["data"], row["mime_type"]

    def recover_interrupted(self):
        """Call once at startup, with exactly one API process per database."""
        with self.db() as db:
            db.execute("UPDATE submissions SET status='failed' WHERE status='processing'")
