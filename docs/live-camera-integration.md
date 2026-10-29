# Live camera integration — 29 October 2026

Merged the 25 changed/new files supplied in Desktop/live camera/changed-files into the current app. Kept the existing landing-page animations, performance fixes and the Meta-assisted AiAllowance component.

The app has a $5 total shared AI allowance, including existing usage and reservations. The separate $20 work budget is authorization for development work, not runtime app allowance. No budget row is reset and no provider billing settings are changed.

Added local quality hints, still selection, target comparison and ghost overlay, supported-device focus/torch/zoom controls, timer, grid, resolution preference, and self-review observations. Added two nullable acknowledgement columns through append-only migrations. Fixed asynchronous tap-to-focus rejection handling. Clarified that account revalidation can clear an in-memory offline queue when backgrounding; nothing sends automatically.

The allowance component was drafted using Meta muse-spark-1.3 in the preceding work, reviewed and integrated with a free GET /api/config refresh. It reads the server balance rather than hardcoding the amount. Reported generation usage: 320 input and 1048 output tokens (estimated $0.004854); this direct coding request is separate from runtime app usage.

Automated verification covers local camera mocks and zero-provider free flows. Physical Android/Chrome and iPhone/Safari camera checks remain pending. No real phone acceptance is inferred from automated tests.
