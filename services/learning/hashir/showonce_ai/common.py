import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
VERSION = "hashir.ai.v1-proposed"
SAFETY = "Visual feedback cannot certify physical safety or hidden properties."


class AIError(Exception):
    """Only these fixed, sanitized messages cross the public boundary."""
    def __init__(self, code, message, retryable=False, status=422):
        super().__init__(message)
        self.code, self.message, self.retryable, self.status = code, message, retryable, status

    def payload(self):
        return {"error": {"code": self.code, "message": self.message, "retryable": self.retryable}}


def validate(kind, value):
    schema = json.loads((ROOT / "contracts" / (kind + ".schema.json")).read_text())
    try:
        json.dumps(value, allow_nan=False)
        Draft202012Validator(schema, format_checker=FormatChecker()).validate(value)
        if kind == "lesson":
            steps = value["steps"]
            if [s["position"] for s in steps] != list(range(1, len(steps) + 1)) or len({s["id"] for s in steps}) != len(steps) or any("source_reference" not in s for s in steps):
                raise ValueError()
    except Exception:
        raise AIError("invalid_contract", f"Invalid {kind} structure.", status=502) from None
    return value


def read_json(name):
    return json.loads((ROOT / "fixtures" / name).read_text())
