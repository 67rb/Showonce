# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
"""Sampled frames, one request in flight and one replaceable pending frame."""
import collections
import copy
import datetime
import threading
import time

from .common import AIError, VERSION, validate


class FrameProcessor:
    def __init__(self, assessor, *, sample_interval=1.5, cooldown=5, max_age=8, failure_backoff=3):
        if sample_interval < 0 or cooldown < 0 or max_age <= 0 or failure_backoff < 0:
            raise ValueError("Invalid live limits")
        self.assessor = assessor
        self.sample_interval, self.cooldown, self.max_age, self.failure_backoff = sample_interval, cooldown, max_age, failure_backoff
        self.condition = threading.Condition()
        self.active, self.closed, self.busy = False, False, False
        self.generation, self.pending, self.context = 0, None, None
        self.events = collections.deque(maxlen=64)
        self.usage = collections.deque(maxlen=128)
        self.stats = collections.Counter()
        self.seen = collections.deque(maxlen=256)
        self.last_sample, self.blocked_until, self.last_feedback = -float("inf"), 0, None
        self.worker = threading.Thread(target=self._run, daemon=True, name="live-frames")
        self.worker.start()

    def start(self, *, session_id, lesson_id, step):
        validate("step", step)
        if not session_id or not lesson_id:
            raise AIError("insufficient_context", "Session and lesson IDs are required.")
        with self.condition:
            if self.closed:
                raise AIError("processor_closed", "Create a new processor after closing.")
            self.generation += 1
            self.context = (session_id, lesson_id, copy.deepcopy(step))
            self.active, self.pending = True, None
            self.events.clear()
            self.seen.clear()
            self.last_sample, self.last_feedback = -float("inf"), None
            self.condition.notify_all()

    def submit(self, *, session_id, step_id, frame_id, captured_at, image, mime_type):
        try:
            stamp = datetime.datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
            if not stamp.tzinfo:
                raise ValueError()
            age = time.time() - stamp.timestamp()
            if not isinstance(frame_id, str) or not 1 <= len(frame_id) <= 128 or not isinstance(image, bytes) or len(image) > 5 * 1024 * 1024:
                raise ValueError()
        except Exception:
            raise AIError("invalid_frame", "Frame needs a short ID, timezone-aware timestamp, and image bytes.") from None
        with self.condition:
            now = time.monotonic()
            if not self.active or self.closed:
                return "stopped"
            if (session_id, step_id) != (self.context[0], self.context[2]["id"]):
                return "stale_context"
            if age > self.max_age or age < -2:
                return "stale"
            if frame_id in self.seen:
                return "duplicate"
            if now < self.blocked_until or now - self.last_sample < self.sample_interval:
                return "sampled_out"
            self.last_sample = now
            self.seen.append(frame_id)
            if self.pending:
                self.stats["replaced"] += 1
            self.pending = (self.generation, self.context, frame_id, captured_at, image, mime_type)
            self.condition.notify_all()
            return "queued"

    def stop(self):
        with self.condition:
            self.generation += 1
            self.active, self.pending = False, None
            self.events.clear()
            self.condition.notify_all()

    def close(self):
        self.stop()
        with self.condition:
            self.closed = True
            self.condition.notify_all()
        self.worker.join(timeout=0.1)

    def drain(self):
        with self.condition:
            result = list(self.events)
            self.events.clear()
            return result

    def metrics(self):
        with self.condition:
            return {"counts": dict(self.stats), "busy": self.busy, "pending": bool(self.pending), "usage": list(self.usage)}

    def _run(self):
        while True:
            with self.condition:
                self.condition.wait_for(lambda: self.closed or self.pending is not None)
                if self.closed:
                    return
                job, self.pending, self.busy = self.pending, None, True
            generation, context, frame_id, captured, image, mime = job
            session, lesson, step = context
            started = time.monotonic()
            stamp = 0
            try:
                stamp = datetime.datetime.fromisoformat(captured.replace("Z", "+00:00")).timestamp()
                if time.time() - stamp > self.max_age:
                    raise AIError("stale_frame", "Frame expired before processing.")
                value = self.assessor.assess(submission_id="frame_" + frame_id, lesson_id=lesson, step=step, image=image, mime_type=mime)
                event = {"schema_version": VERSION, "type": "assessment", "session_id": session, "step_id": step["id"], "frame_id": frame_id,
                         "captured_at": captured, "latency_ms": round((time.monotonic() - started) * 1000, 2), "assessment": value}
                validate("event", event)
            except AIError as error:
                event = {"schema_version": VERSION, "type": "error", "session_id": session, "step_id": step["id"], "frame_id": frame_id,
                         "captured_at": captured, "latency_ms": round((time.monotonic() - started) * 1000, 2), **error.payload()}
            except Exception:
                event = {"schema_version": VERSION, "type": "error", "session_id": session, "step_id": step["id"], "frame_id": frame_id,
                         "captured_at": captured, "latency_ms": round((time.monotonic() - started) * 1000, 2),
                         "error": {"code": "provider_failure", "message": "Frame assessment failed.", "retryable": True}}
            with self.condition:
                self.busy = False
                self.stats["processed"] += 1
                self.usage.append({"frame_id": frame_id, "step_id": step["id"], "latency_ms": event["latency_ms"],
                                   "provider": event.get("assessment", {}).get("provider"),
                                   "model": event.get("assessment", {}).get("model"),
                                   "usage": event.get("assessment", {}).get("usage"), "status": event["type"],
                                   "note": "Failed/timed out calls may still be billable; reconcile with provider." if event["type"] == "error" else None})
                if not self.active or generation != self.generation or time.time() - stamp > self.max_age:
                    self.stats["discarded"] += 1
                    continue
                if event["type"] == "error" and event["error"]["retryable"]:
                    self.blocked_until = time.monotonic() + self.failure_backoff
                    self.pending = None
                feedback = event.get("assessment", {})
                fingerprint = (feedback.get("result"), tuple(feedback.get("corrections", [])), tuple(feedback.get("requested_evidence", []))) if event["type"] == "assessment" else ("error", event["error"]["code"])
                now = time.monotonic()
                if self.last_feedback and self.last_feedback[0] == fingerprint and now - self.last_feedback[1] < self.cooldown:
                    self.stats["deduplicated"] += 1
                    continue
                self.last_feedback = fingerprint, now
                self.events.append(event)
