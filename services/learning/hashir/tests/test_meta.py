# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
import base64
import concurrent.futures
import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path

from showonce_ai import TutorialPipeline, PhotoAssessor
from showonce_ai.assessment import FixtureVision
from showonce_ai.budget import MetaBudget, spark_cost_microusd
from showonce_ai.common import AIError, ROOT, VERSION
from showonce_ai.demo import DemoServer
from showonce_ai.meta import MetaVision


class BudgetAndMetaTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        self.budget = MetaBudget(Path(directory.name) / "budget.sqlite3")
        self.lesson = TutorialPipeline().process("https://origami.me/cup/")
        self.step = self.lesson["steps"][0]
        self.image = (ROOT / "fixtures/images/cup_01_correct.png").read_bytes()

    def test_pricing_and_durable_limit(self):
        self.assertEqual(spark_cost_microusd(1_000_000, 1_000_000), 5_500_000)
        self.budget.reserve(5_000_000)
        reopened = MetaBudget(self.budget.path)
        self.assertEqual(reopened.summary()["remaining_usd"], 0)
        with self.assertRaises(AIError) as error: reopened.reserve(1)
        self.assertEqual(error.exception.code, "budget_exhausted")

    def test_atomic_reservations_under_concurrency(self):
        def attempt(_):
            try: return self.budget.reserve(1_000_000)
            except AIError: return None
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(attempt, range(12)))
        self.assertEqual(sum(r is not None for r in results), 5)
        self.assertEqual(self.budget.summary()["charged_or_reserved_usd"], 5)

    def test_settlement_refunds_unused_reservation(self):
        identifier = self.budget.reserve(10000)
        cost = self.budget.settle(identifier, 1000, 100)
        self.assertEqual(cost, 0.001675)
        self.assertEqual(self.budget.summary()["unresolved_reservations_usd"], 0)

    def test_unexpected_usage_blocks_further_calls(self):
        identifier = self.budget.reserve(1)
        with self.assertRaises(AIError): self.budget.settle(identifier, 1000, 100)
        with self.assertRaises(AIError): self.budget.reserve(1)

    def transport(self, *, final=None, generation_error=None, count=1000):
        self.requests = []
        value = FixtureVision().infer(image=self.image, mime_type="image/png", step=self.step, timeout=1)
        value.pop("usage")
        def call(path, payload, timeout):
            self.requests.append((path, payload))
            if path.endswith("input_tokens"): return {"input_tokens": count}
            if generation_error: raise generation_error
            return final or {"model": "muse-spark-1.3", "status": "completed", "usage": {"input_tokens": 1000, "output_tokens": 200},
                "output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(value)}]}]}
        return call

    def test_meta_output_and_identical_preflight_payload(self):
        provider = MetaVision(key="TEST_ONLY", budget=self.budget, transport=self.transport())
        assessor = PhotoAssessor(provider); self.addCleanup(assessor.close)
        result = assessor.assess(submission_id="test", lesson_id=self.lesson["id"], step=self.step, image=self.image, mime_type="image/png")
        self.assertEqual(result["result"], "pass")
        self.assertEqual(result["provider"], "meta")
        self.assertEqual(self.requests[0][1], self.requests[1][1])
        self.assertTrue(self.requests[1][1]["text"]["format"]["strict"])
        self.assertFalse(self.requests[1][1]["store"])
        self.assertNotIn("TEST_ONLY", json.dumps(self.requests))
        self.assertNotIn("tools", self.requests[1][1])

    def test_count_limit_prevents_generation(self):
        provider = MetaVision(key="TEST_ONLY", budget=self.budget, transport=self.transport(count=16001))
        with self.assertRaises(AIError): provider.infer(image=self.image, mime_type="image/png", step=self.step, timeout=1)
        self.assertEqual(len(self.requests), 1)
        self.assertEqual(self.budget.summary()["generation_calls_reserved"], 0)

    def test_timeout_keeps_full_reservation_without_retry(self):
        provider = MetaVision(key="TEST_ONLY", budget=self.budget, transport=self.transport(generation_error=AIError("provider_timeout", "Timed out.", True)))
        with self.assertRaises(AIError): provider.infer(image=self.image, mime_type="image/png", step=self.step, timeout=1)
        self.assertEqual(len(self.requests), 2)
        summary = self.budget.summary()
        self.assertGreater(summary["unresolved_reservations_usd"], 0)
        self.assertEqual(summary["charged_or_reserved_usd"], summary["unresolved_reservations_usd"])

    def test_bad_output_still_records_usage(self):
        final = {"status": "completed", "usage": {"input_tokens": 1000, "output_tokens": 200}, "output": [{"type": "message", "content": [{"type": "output_text", "text": "not JSON"}]}]}
        provider = MetaVision(key="TEST_ONLY", budget=self.budget, transport=self.transport(final=final))
        with self.assertRaises(AIError) as error: provider.infer(image=self.image, mime_type="image/png", step=self.step, timeout=1)
        self.assertEqual(error.exception.code, "invalid_provider_response")
        self.assertGreater(self.budget.summary()["charged_or_reserved_usd"], 0)
        self.assertEqual(self.budget.summary()["unresolved_reservations_usd"], 0)

    def test_schema_echo_is_rejected_without_refunding_usage(self):
        echo = json.loads((ROOT / "fixtures/meta-schema-echo.json").read_text())
        echo.pop("usage", None)
        final = {"status": "completed", "usage": {"input_tokens": 1000, "output_tokens": 200}, "output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(echo)}]}]}
        provider = MetaVision(key="TEST_ONLY", budget=self.budget, transport=self.transport(final=final))
        assessor = PhotoAssessor(provider); self.addCleanup(assessor.close)
        with self.assertRaises(AIError) as error:
            assessor.assess(submission_id="echo", lesson_id=self.lesson["id"], step=self.step, image=self.image, mime_type="image/png")
        self.assertEqual(error.exception.code, "invalid_provider_response")
        self.assertGreater(self.budget.summary()["charged_or_reserved_usd"], 0)

    def test_explorer_preview_never_calls_paid_provider(self):
        owner = self
        class PaidSpy(FixtureVision):
            name, is_mock = "meta", False
            def infer(self, **kwargs):
                owner.fail("State explorer must not call the paid provider")
        server = DemoServer(("127.0.0.1", 0), provider=PaidSpy())
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            body = {"schema_version": VERSION, "submission_id": "preview", "lesson_id": self.lesson["id"], "step": self.step,
                    "mime_type": "image/png", "image_base64": base64.b64encode(self.image).decode()}
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=2)
            connection.request("POST", "/api/preview/assess", body=json.dumps(body), headers={"Content-Type": "application/json", "X-Demo-Token": server.token})
            response = connection.getresponse(); result = json.loads(response.read()); connection.close()
            self.assertEqual(response.status, 200)
            self.assertTrue(result["is_mock"])
        finally:
            server.shutdown(); server.server_close(); thread.join(2)


if __name__ == "__main__":
    unittest.main()
