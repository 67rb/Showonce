import concurrent.futures
import copy
import io
import json
import hashlib
import threading
import time
import warnings

from PIL import Image

from .common import AIError, ROOT, VERSION, SAFETY, validate

MAX_IMAGE = 5 * 1024 * 1024


def check_image(image, mime_type):
    if not isinstance(image, bytes) or not image:
        raise AIError("invalid_image", "Supply image bytes.")
    if len(image) > MAX_IMAGE:
        raise AIError("image_too_large", "Image limit is 5 MiB.", status=413)
    formats = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}
    if mime_type not in formats:
        raise AIError("unsupported_image", "Use PNG, JPEG, or WebP.", status=415)
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(image)) as photo:
                if photo.format != formats[mime_type] or photo.width * photo.height > 16_000_000 or getattr(photo, "n_frames", 1) != 1:
                    raise ValueError()
                photo.verify()
            with Image.open(io.BytesIO(image)) as photo:
                photo.load()
    except Exception:
        raise AIError("invalid_image", "Image is corrupt, animated, too large in pixels, or does not match its type.") from None


class FixtureVision:
    name, model, is_mock = "mock", "annotated-fixtures-v1", True

    def infer(self, *, image, mime_type, step, timeout):
        manifest = json.loads((ROOT / "fixtures" / "images.json").read_text())
        key = hashlib.sha256(image).hexdigest()
        case = next((c for c in manifest if c["sha256"] == key and c["step_id"] == step["id"]), None)
        result = case["result"] if case else "uncertain"
        statuses = ["supported"] * len(step["assessment_criteria"]) if result == "pass" else ["not_visible"] * len(step["assessment_criteria"])
        if result == "retry":
            statuses[0] = "violated"
        observation = case["annotation"] if case else "No registered fixture annotation exists for this image and step."
        return {"observations": ["Fixture annotation: " + observation] if case else [],
                "feedback": "Mock assessment: " + observation,
                "corrections": [case["correction"]] if result == "retry" else [],
                "requested_evidence": ["Show the whole work clearly from above; use the requested view."] if result == "uncertain" else [],
                "criteria": [{"criterion": c, "status": s, "evidence": "Fixture annotation: " + observation if s != "not_visible" else "This view cannot establish this criterion."} for c, s in zip(step["assessment_criteria"], statuses)],
                "usage": {"estimated_cost_usd": 0, "input_tokens": None, "output_tokens": None}}


class PhotoAssessor:
    def __init__(self, provider=None, timeout=20, max_concurrent=2):
        self.provider = provider or FixtureVision()
        self.timeout = timeout
        self.pool = concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent, thread_name_prefix="photo-provider")
        self.capacity = threading.BoundedSemaphore(max_concurrent)

    def close(self):
        self.pool.shutdown(wait=False, cancel_futures=True)

    def assess(self, *, submission_id, lesson_id, step, image, mime_type):
        if not all(isinstance(v, str) and v.strip() for v in (submission_id, lesson_id)):
            raise AIError("insufficient_context", "Submission and lesson IDs are required.")
        step = copy.deepcopy(step)
        validate("step", step)
        check_image(image, mime_type)
        if not self.capacity.acquire(blocking=False):
            raise AIError("provider_busy", "Assessment capacity is busy; retry shortly.", True, 429)
        started = time.monotonic()
        try:
            future = self.pool.submit(self.provider.infer, image=image, mime_type=mime_type, step=step, timeout=self.timeout)
        except Exception:
            self.capacity.release()
            raise AIError("provider_failure", "Assessment service is unavailable.", True, 502) from None
        future.add_done_callback(lambda _: self.capacity.release())
        try:
            raw = future.result(timeout=self.timeout)
        except concurrent.futures.TimeoutError:
            future.cancel()
            raise AIError("provider_timeout", "Assessment timed out; please retry.", True, 504) from None
        except AIError:
            raise
        except Exception:
            raise AIError("provider_failure", "Assessment provider failed; please retry.", True, 502) from None
        try:
            if isinstance(raw, str):
                raw = json.loads(raw)
            validate("vision-output", raw)
            checks = raw["criteria"]
            if [c["criterion"] for c in checks] != step["assessment_criteria"]:
                raise ValueError()
            statuses = [c["status"] for c in checks]
            result = "retry" if "violated" in statuses else "pass" if all(s == "supported" for s in statuses) else "uncertain"
            if result == "retry" and not raw["corrections"] or result == "uncertain" and not raw["requested_evidence"]:
                raise ValueError()
            if result in ("pass", "retry") and not raw["observations"]:
                raise ValueError()
            if result == "pass" and (raw["corrections"] or raw["requested_evidence"]):
                raise ValueError()
            assessment = {"schema_version": VERSION, "submission_id": submission_id, "lesson_id": lesson_id,
                          "step_id": step["id"], "result": result, **raw,
                          "provider": self.provider.name, "model": self.provider.model, "is_mock": self.provider.is_mock,
                          "latency_ms": round((time.monotonic() - started) * 1000, 2), "safety_notice": SAFETY}
            return validate("assessment", assessment)
        except Exception:
            raise AIError("invalid_provider_response", "Assessment response was incomplete or malformed.", True, 502) from None


class BackendAssessmentAdapter:
    """Implements Master's existing Protocol; backend owns submission/progress IDs.

    The provider boundary has no lesson/submission IDs. Strip temporary envelope
    IDs before returning to avoid associating them with backend-owned IDs.
    """
    def __init__(self, assessor=None):
        self.assessor = assessor or PhotoAssessor()

    def assess(self, *, image, mime_type, step, scenario):
        # scenario intentionally ignored; mock annotations come from fixture bytes.
        value = self.assessor.assess(submission_id="boundary_pending", lesson_id="boundary_pending", step=step, image=image, mime_type=mime_type)
        return {k: v for k, v in value.items() if k not in ("submission_id", "lesson_id")}
