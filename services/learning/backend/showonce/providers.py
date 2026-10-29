"""Hashir owns real implementations of these provider interfaces."""
from typing import Protocol


class TutorialProvider(Protocol):
    def process(self, source_url: str) -> dict: ...


class AssessmentProvider(Protocol):
    def assess(self, *, image: bytes, mime_type: str, step: dict, scenario: str) -> dict: ...


class MockTutorialProvider:
    def process(self, source_url: str) -> dict:
        return {
            "title": "Sample paper fold practice", "source_url": source_url,
            "category": "origami", "content_origin": "mock_sample",
            "practice_restrictions": ["Sample content; instructions were not extracted from the supplied link."],
            "steps": [
                {"id": "fold_01", "position": 1, "instructions": "Place a square sheet of paper on a flat surface.",
                 "expected_visual_result": "A complete square sheet is visible on a flat surface.",
                 "assessment_criteria": ["All four corners are visible", "Paper lies flat"]},
                {"id": "fold_02", "position": 2, "instructions": "Fold the sheet in half and align the opposite edges.",
                 "expected_visual_result": "A rectangle with aligned opposite edges and a visible crease.",
                 "assessment_criteria": ["Paper is folded in half", "Opposite edges align"]}
            ]
        }


class MockAssessmentProvider:
    def assess(self, *, image: bytes, mime_type: str, step: dict, scenario: str) -> dict:
        messages = {
            "pass": ("Mock result: practice criteria met.", []),
            "retry": ("Mock result: adjust your work and try again.", ["Check: " + step["expected_visual_result"]]),
            "uncertain": ("Mock result: unable to assess this image.", ["Retake with the entire object visible and better lighting."])
        }
        feedback, corrections = messages[scenario]
        return {"result": scenario, "feedback": feedback, "corrections": corrections,
                "provider": "mock", "model": "fake-assessor-v1", "is_mock": True,
                "usage": {"estimated_cost_usd": 0, "input_tokens": None, "output_tokens": None}}
