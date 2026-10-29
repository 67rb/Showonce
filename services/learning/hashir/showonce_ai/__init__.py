"""Hashir's independent AI boundary. No persistence or frontend dependency."""
from .assessment import PhotoAssessor, FixtureVision, BackendAssessmentAdapter
from .ingestion import TutorialPipeline
from .live import FrameProcessor

__all__ = ["PhotoAssessor", "FixtureVision", "BackendAssessmentAdapter", "TutorialPipeline", "FrameProcessor"]
