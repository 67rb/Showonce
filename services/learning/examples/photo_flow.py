# Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
"""End-to-end HTTP demo. Start the backend before running this file."""
import json
import os
import urllib.request
import uuid

BASE = os.environ.get("SHOWONCE_API_URL", "http://127.0.0.1:8000")
PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="


def request(path, body=None, token=None, key=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    if key:
        headers["Idempotency-Key"] = key
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.load(response)


lesson = request("/v1/lessons", {"source_url": "https://example.com/my-tutorial"})
session = request("/v1/sessions", {"lesson_id": lesson["id"]})
path = "/v1/sessions/" + session["session_id"]
for step in lesson["steps"]:
    key = uuid.uuid4().hex
    body = {"step_id": step["id"], "mime_type": "image/png", "image_base64": PNG, "mock_result": "pass"}
    result = request(path + "/submissions", body, session["access_token"], key)
    replay = request(path + "/submissions", body, session["access_token"], key)
    assert replay["replayed"] and replay["progress"] == result["progress"]
    print(json.dumps(result, indent=2))
assert request(path + "/progress", token=session["access_token"])["status"] == "completed"
print("Completed photo flow, including duplicate replay protection.")
