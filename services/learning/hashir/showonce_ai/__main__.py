# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
import argparse
import json
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .assessment import PhotoAssessor
from .common import AIError, ROOT
from .ingestion import TutorialPipeline, SafeHTMLFetcher, SOURCE
from .live import FrameProcessor


def main():
    parser = argparse.ArgumentParser(description="Hashir's independent Show Once tools (mocks by default)")
    parser.add_argument("command", choices=["demo", "ingest", "smoke", "live-demo", "assess-live", "budget"])
    parser.add_argument("--url", default=SOURCE)
    parser.add_argument("--fetch-live", action="store_true", help="Fetch the single reviewed public source; no AI credits")
    parser.add_argument("--image", type=Path)
    parser.add_argument("--step", type=int, default=1)
    parser.add_argument("--allow-one-paid-call", action="store_true")
    parser.add_argument("--provider", choices=["meta", "nvidia"])
    parser.add_argument("--env-file", type=Path, help="Explicit server-only key configuration; never served")
    args = parser.parse_args()
    if args.command == "budget":
        from .budget import MetaBudget
        print(json.dumps(MetaBudget().summary(), indent=2))
        return
    if args.command == "demo":
        from .demo import run
        if args.provider == "meta":
            from .meta import MetaVision, load_meta_key
            return run(MetaVision(key=load_meta_key(args.env_file)))
        if args.provider:
            raise AIError("unsupported_demo_provider", "Use --provider meta for budget-limited live vision, or omit it for mocks.")
        return run()
    lesson = TutorialPipeline(fetcher=SafeHTMLFetcher() if args.fetch_live else None).process(args.url)
    if args.command == "ingest":
        print(json.dumps(lesson, indent=2))
        return
    assessor = PhotoAssessor()
    try:
        if args.command == "assess-live":
            if not args.allow_one_paid_call or not args.image or not 1 <= args.step <= len(lesson["steps"]):
                raise AIError("explicit_opt_in_required", "Use --allow-one-paid-call --image PATH --step 1..7 to send one image to the selected provider.")
            if args.provider == "meta":
                from .meta import MetaVision, load_meta_key
                provider = MetaVision(key=load_meta_key(args.env_file))
            else:
                from .nvidia import NvidiaVision
                provider = NvidiaVision()
            assessor.close()
            assessor = PhotoAssessor(provider, timeout=40)
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}.get(args.image.suffix.lower())
            result = assessor.assess(submission_id="local_" + uuid.uuid4().hex, lesson_id=lesson["id"], step=lesson["steps"][args.step - 1], image=args.image.read_bytes(), mime_type=mime)
            print(json.dumps(result, indent=2))
        elif args.command == "live-demo":
            processor = FrameProcessor(assessor, sample_interval=0, cooldown=0)
            processor.start(session_id="sample_session", lesson_id=lesson["id"], step=lesson["steps"][0])
            try:
                for case in ("mistake", "blurred", "correct"):
                    processor.submit(session_id="sample_session", step_id=lesson["steps"][0]["id"], frame_id=case, captured_at=datetime.now(timezone.utc).isoformat(), image=(ROOT / f"fixtures/images/cup_01_{case}.png").read_bytes(), mime_type="image/png")
                    deadline = time.monotonic() + 3
                    while time.monotonic() < deadline:
                        events = processor.drain()
                        if events:
                            print(json.dumps(events[0]))
                            break
                        time.sleep(0.01)
                    else:
                        raise AIError("demo_timeout", "No feedback received for the sample frame.")
                processor.stop()
                print(json.dumps({"metrics": processor.metrics()}))
            finally:
                processor.close()
        else:
            outcomes = []
            for step in lesson["steps"]:
                result = assessor.assess(submission_id="smoke_" + step["id"], lesson_id=lesson["id"], step=step, image=(ROOT / f"fixtures/images/{step['id']}_correct.png").read_bytes(), mime_type="image/png")
                assert result["result"] == "pass"
                outcomes.append(result["result"])
            for case, expected in (("mistake", "retry"), ("blurred", "uncertain"), ("unrelated", "uncertain"), ("hidden", "uncertain")):
                result = assessor.assess(submission_id="smoke_" + case, lesson_id=lesson["id"], step=lesson["steps"][0], image=(ROOT / f"fixtures/images/cup_01_{case}.png").read_bytes(), mime_type="image/png")
                assert result["result"] == expected
            print(json.dumps({"status": "ok", "mode": "mock", "lesson_id": lesson["id"], "completed_photo_checkpoints": len(outcomes), "additional_fixture_cases": 4, "live_provider_tested": False}))
    finally:
        assessor.close()


if __name__ == "__main__":
    try:
        main()
    except AIError as error:
        print(json.dumps(error.payload()), file=sys.stderr)
        sys.exit(1)
