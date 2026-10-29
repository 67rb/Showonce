"""Run against Master's real Backend class, with temporary local persistence.

No edits to Master's files, no API calls, no server or production data changes.
"""
import base64
import json
import tempfile
from pathlib import Path

from showonce.core import Backend
from showonce_ai import TutorialPipeline, PhotoAssessor, BackendAssessmentAdapter
from showonce_ai.common import ROOT


def main():
    assessor = PhotoAssessor()
    try:
        with tempfile.TemporaryDirectory() as directory:
            backend = Backend(
                Path(directory) / "nightly-example.sqlite3",
                tutorial_provider=TutorialPipeline(),
                assessment_provider=BackendAssessmentAdapter(assessor),
                # Prevent caller-selected mock outcomes; the adapter still uses
                # fixtures and reports is_mock=True. This flag is not proof of AI.
                mock_mode=False,
            )
            lesson = backend.create_lesson({"source_url": "https://origami.me/cup/"})
            session = backend.create_session({"lesson_id": lesson["id"]})
            for step in lesson["steps"]:
                image = (ROOT / f"fixtures/images/{step['id']}_correct.png").read_bytes()
                value = backend.submit(session["session_id"], session["access_token"], {
                    "step_id": step["id"], "mime_type": "image/png", "image_base64": base64.b64encode(image).decode()
                }, "nightly_" + step["id"])
                assert value["submission"]["assessment"]["result"] == "pass"
            assert value["progress"]["status"] == "completed"
            print(json.dumps({"status": "ok", "mode": "mock", "backend_progress": value["progress"], "submissions": len(backend.history(session["session_id"], session["access_token"]))}))
    finally:
        assessor.close()


if __name__ == "__main__":
    main()
