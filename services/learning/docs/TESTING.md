# Test handoff for Deva

Automated command:

```sh
PYTHONPATH=backend python3 -m unittest discover -s backend/tests -v
```

Current automated coverage:

- Photo journey completes, and saved state survives constructing a new backend.
- Retry and uncertain outcomes do not advance.
- Repeated keys return one submission; changed content conflicts.
- Eight concurrent duplicate requests advance once and record usage once.
- Wrong-step requests and invalid/cross-session tokens are rejected.
- Invalid base64, MIME mismatch, unsupported MIME, and oversized input fail.
- Private images can be retrieved and deleted; repeat deletion is harmless.
- Unsupported links fail, and mock source content is clearly labeled.
- Provider failures preserve progress; startup recovery clears interrupted work.
- Failed finalization rolls back progress and allows a fresh submission after recovery.
- Failed cleanup is retried after storage becomes writable, without restarting.
- The submitted source URL is preserved, and malformed lesson list elements are rejected.
- Real mode cannot start without providers.
- HTTP health, JSON errors, CORS, session creation, and authenticated resume work.

Manual integration cases when the frontend and real providers arrive:

| Case | Expected behaviour |
|---|---|
| Correct work | Real feedback supports pass; exactly one step advances |
| Incorrect work | Useful correction; same step remains current |
| Blurred/occluded image | Uncertain and request for clearer evidence |
| Unsupported real tutorial source | Actionable error; no misleading generated lesson |
| Interrupted upload/network response | Reuse original key/check history; no double advancement |
| Browser refresh | Resume existing session with stored token |
| Retake | New image and key; earlier submission history remains |
| Repeated click | One submission and one advancement |
| Provider timeout | Failure saved, step unchanged, retry path shown |
| Delete evidence | Image becomes unavailable; progress/history remain |
| Trade practice | Feedback is framed as practice, never safety certification |
| Live video | Pending a separate agreed contract and implementation |

Record issue: title, component revision, setup, exact steps/request, expected and
actual result, reproducible evidence, severity, owner, and fix verification.
Redact bearer tokens and real learner images from shared issue records.
