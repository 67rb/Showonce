# Practice flow review — 27 October 2026

Reviewed the existing multi-skill app on desktop and at 390 px mobile width. Retained the green/cream visual design and all existing AI routes and budget limits.

Changes:
- Progress counts completed checkpoint records rather than the selected step number. Finishing a later step returns to outstanding work; completion requires every checkpoint.
- Saved practice shows its title and checkpoint count, preserves the selected checkpoint, and reopens completed records correctly. Saved records are copied and checked against step IDs.
- Each practice screen has a lesson-overview action and a visible completion count. Screen changes return to the top. Supporting instructions are more readable and mobile mode controls have 44 px minimum height.
- Processing can return to the source form without losing the draft. The notice explains that an already-sent AI call may still use the allowance. Startup now says it is connecting rather than claiming fixture mode.
- Free mode accepts short, valid numbered instructions. A URL without pasted numbered steps produces specific guidance and performs no source fetch or model call.
- Camera permission responses are ignored and tracks stopped if the learner has left. Duplicate opens are suppressed; disconnected tracks and provider failures stop feedback and tracks. Photo selection races are guarded and replacement is ignored during assessment.

Validation: 19 JavaScript tests (including five frontend lifecycle/progress regressions), 40 Hashir Python tests and 15 existing backend tests. Worker artifact validation. Browser checks cover example loading, out-of-order practice, all-checkpoint completion, saved completion, short free lessons and mobile navigation. No paid model requests were needed for this review.

Limits: camera lifecycle is tested with controlled streams; physical camera capture was not exercised. This review is not a complete accessibility conformance audit. Account-based progress and full team backend integration remain separate project work.
