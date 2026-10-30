# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
import base64
import concurrent.futures
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from showonce.core import ApiError, Backend
from showonce.server import create_server
from showonce.providers import MockTutorialProvider

PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="


class BackendTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.backend = Backend(Path(self.temp.name) / "test.db")
        self.session = self.backend.create_session({"lesson_id": "lesson_sample_origami"})
        self.sid, self.token = self.session["session_id"], self.session["access_token"]

    def tearDown(self):
        self.temp.cleanup()

    def submit(self, result="pass", step="fold_01", key="key1"):
        return self.backend.submit(self.sid, self.token, {"step_id": step, "mime_type": "image/png", "image_base64": PNG, "mock_result": result}, key)

    def error(self, code, function):
        with self.assertRaises(ApiError) as raised:
            function()
        self.assertEqual(raised.exception.code, code)

    def test_complete_and_resume_after_restart(self):
        self.submit()
        restarted = Backend(self.backend.path)
        self.assertEqual(restarted.progress(self.sid, self.token)["current_step_id"], "fold_02")
        result = self.submit(step="fold_02", key="key2")
        self.assertEqual(result["progress"]["status"], "completed")
        self.assertIsNone(result["progress"]["current_step_id"])
        self.assertEqual(len(self.backend.history(self.sid, self.token)), 2)
        self.assertEqual(len(self.backend.usage(self.sid, self.token)), 2)

    def test_retry_uncertain_do_not_advance(self):
        for result in ("retry", "uncertain"):
            self.assertEqual(self.submit(result, key=result)["progress"]["completed_step_ids"], [])

    def test_duplicate_and_key_conflict(self):
        first = self.submit()
        repeated = self.submit()
        self.assertEqual(first["submission"]["id"], repeated["submission"]["id"])
        self.assertTrue(repeated["replayed"])
        self.assertEqual(repeated["progress"]["completed_step_ids"], ["fold_01"])
        self.error("idempotency_conflict", lambda: self.submit("retry"))

    def test_parallel_duplicate_advances_once(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.submit(), range(8)))
        self.assertEqual(len({r["submission"]["id"] for r in results}), 1)
        self.assertEqual(self.backend.progress(self.sid, self.token)["completed_step_ids"], ["fold_01"])
        self.assertEqual(len(self.backend.usage(self.sid, self.token)), 1)

    def test_wrong_step_and_access(self):
        self.error("step_not_current", lambda: self.submit(step="fold_02"))
        self.error("invalid_session_access", lambda: self.backend.progress(self.sid, "wrong"))
        other = self.backend.create_session({"lesson_id": "lesson_sample_origami"})
        self.error("invalid_session_access", lambda: self.backend.history(self.sid, other["access_token"]))

    def test_image_validation(self):
        for mime, data in (("text/plain", PNG), ("image/png", "!"), ("image/jpeg", PNG)):
            self.error("invalid_image", lambda: self.backend.submit(self.sid, self.token, {"step_id": "fold_01", "mime_type": mime, "image_base64": data}, "bad"))
        self.error("image_too_large", lambda: self.backend.decode_image({"mime_type": "image/png", "image_base64": "a" * 7_000_001}))

    def test_private_image_and_repeatable_delete(self):
        sub = self.submit()["submission"]["id"]
        self.assertEqual(self.backend.image(self.sid, sub, self.token)[0], base64.b64decode(PNG))
        self.error("invalid_session_access", lambda: self.backend.image(self.sid, sub, "bad"))
        self.backend.image(self.sid, sub, self.token, delete=True)
        self.backend.image(self.sid, sub, self.token, delete=True)
        self.error("image_not_found", lambda: self.backend.image(self.sid, sub, self.token))
        self.assertEqual(len(self.backend.history(self.sid, self.token)), 1)

    def test_bad_links_and_mock_label(self):
        for source in ("file:///etc/passwd", "not a link", "https://user:secret@example.com", None, "http://["):
            self.error("unsupported_link", lambda: self.backend.create_lesson({"source_url": source}))
        lesson = self.backend.create_lesson({"source_url": "https://example.com/tutorial"})
        self.assertEqual(lesson["content_origin"], "mock_sample")

    def test_provider_failure_and_recovery(self):
        class Broken:
            def assess(self, **kwargs):
                raise RuntimeError("provider down")
        self.backend.assessment_provider = Broken()
        self.error("assessment_failed", self.submit)
        self.assertEqual(self.backend.history(self.sid, self.token)[0]["status"], "failed")
        self.assertEqual(self.backend.progress(self.sid, self.token)["current_step_id"], "fold_01")
        with self.backend.db() as db:
            db.execute("UPDATE submissions SET status='processing'")
        self.backend.recover_interrupted()
        self.assertEqual(self.backend.history(self.sid, self.token)[0]["status"], "failed")

    def test_inflight_guard_and_invalid_provider_output(self):
        started, release = threading.Event(), threading.Event()
        backend = self.backend
        class Slow:
            def assess(self, **kwargs):
                started.set()
                release.wait(5)
                return {"result": "pass", "feedback": "done", "corrections": [],
                        "provider": "test", "model": "test", "usage": {"estimated_cost_usd": 0}}
        backend.assessment_provider = Slow()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(self.submit)
            try:
                self.assertTrue(started.wait(5))
                replay = self.submit()
                self.assertEqual(replay["submission"]["status"], "processing")
                self.error("assessment_in_progress", lambda: self.submit(key="other"))
            finally:
                release.set()
            self.assertEqual(future.result()["progress"]["current_step_id"], "fold_02")
        class Invalid:
            def assess(self, **kwargs):
                return {"result": "pass", "feedback": "bad usage", "corrections": [],
                        "provider": "test", "model": "test", "usage": {"estimated_cost_usd": "bad"}}
        backend.assessment_provider = Invalid()
        self.error("assessment_failed", lambda: self.submit(step="fold_02", key="invalid"))
        self.assertEqual(backend.progress(self.sid, self.token)["current_step_id"], "fold_02")

    def test_finalization_failure_rolls_back_progress_and_allows_retry(self):
        # Fail after the assessment/progress UPDATEs, proving the whole transaction rolls back.
        with self.backend.db() as db:
            db.execute("CREATE TRIGGER reject_usage BEFORE INSERT ON usage_events WHEN NEW.status='succeeded' BEGIN SELECT RAISE(ABORT, 'write failed'); END")
        self.error("finalization_failed", self.submit)
        history = self.backend.history(self.sid, self.token)
        self.assertEqual(history[0]["status"], "failed")
        self.assertEqual(self.backend.progress(self.sid, self.token)["completed_step_ids"], [])
        self.assertEqual(self.backend.usage(self.sid, self.token)[0]["provider"], "mock")
        self.assertEqual(self.backend.usage(self.sid, self.token)[0]["status"], "failed")
        self.assertTrue(self.submit()["replayed"])
        with self.backend.db() as db:
            db.execute("DROP TRIGGER reject_usage")
        result = self.submit(key="recovered")
        self.assertEqual(result["progress"]["completed_step_ids"], ["fold_01"])
        self.assertEqual(len(self.backend.usage(self.sid, self.token)), 2)

    def test_finalization_cleanup_retries_after_storage_recovers(self):
        with self.backend.db() as db:
            db.execute("CREATE TRIGGER reject_updates BEFORE UPDATE ON submissions BEGIN SELECT RAISE(ABORT, 'storage unavailable'); END")
        self.error("finalization_failed", self.submit)
        with self.backend.db() as db:
            self.assertEqual(db.execute("SELECT status FROM submissions").fetchone()["status"], "processing")
            db.execute("DROP TRIGGER reject_updates")
        # The next state read recovers without a restart or provider replay.
        self.assertEqual(self.backend.history(self.sid, self.token)[0]["status"], "failed")
        self.assertEqual(len(self.backend.usage(self.sid, self.token)), 1)
        self.assertEqual(self.submit(key="new")["progress"]["current_step_id"], "fold_02")

    def test_lesson_source_is_preserved_and_malformed_lists_are_rejected(self):
        original_url = "https://example.com/tutorial"
        class Tutorial:
            def process(self, source_url):
                return self.data
        provider = Tutorial()
        self.backend.tutorial_provider = provider
        for source in (None, "https://wrong.example/tutorial"):
            provider.data = MockTutorialProvider().process(original_url)
            if source is None:
                del provider.data["source_url"]
            else:
                provider.data["source_url"] = source
            saved = self.backend.create_lesson({"source_url": original_url})
            self.assertEqual(saved["source_url"], original_url)
            self.assertEqual(self.backend.lesson(saved["id"])["source_url"], original_url)
        count = len(self.backend.lessons())
        for field in ("practice_restrictions", "assessment_criteria"):
            for value in ([123], [None], ["valid", {}], [""], ["   "], "not a list"):
                with self.subTest(field=field, value=value):
                    provider.data = MockTutorialProvider().process(original_url)
                    target = provider.data if field == "practice_restrictions" else provider.data["steps"][0]
                    target[field] = value
                    self.error("invalid_lesson", lambda: self.backend.create_lesson({"source_url": original_url}))
        provider.data = None
        self.error("invalid_lesson", lambda: self.backend.create_lesson({"source_url": original_url}))
        self.assertEqual(len(self.backend.lessons()), count)

    def test_real_mode_requires_providers(self):
        with self.assertRaises(ValueError):
            Backend(self.backend.path, mock_mode=False)

    def test_http_contract(self):
        server = create_server(self.backend, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_address[1]}"
        def request(path, body=None, headers=None):
            req = urllib.request.Request(base + path, data=body, headers=headers or {})
            return urllib.request.urlopen(req)
        try:
            with request("/health") as response:
                self.assertTrue(json.load(response)["mock_mode"])
            with self.assertRaises(urllib.error.HTTPError) as raised:
                request("/v1/sessions", b"{broken", {"Content-Type": "application/json"})
            self.assertEqual(raised.exception.code, 400)
            self.assertEqual(json.load(raised.exception)["error"]["code"], "invalid_json")
            raised.exception.close()
            with request("/v1/sessions", json.dumps({"lesson_id": "lesson_sample_origami"}).encode(), {"Content-Type": "application/json", "Origin": "http://localhost:3000"}) as response:
                self.assertEqual(response.status, 201)
                self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://localhost:3000")
                session = json.load(response)
            with request("/v1/sessions/" + session["session_id"] + "/progress", headers={"Authorization": "Bearer " + session["access_token"]}) as response:
                self.assertEqual(json.load(response)["current_step_id"], "fold_01")
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
