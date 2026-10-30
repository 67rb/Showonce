# New professional UI integration — 29 October 2026

Source: `Showonce-master (2).zip`, archive commit `3f0917619f0331baa8cc6bfdfb43090082ea7d00`. The connected GitHub master ref matched that commit when selected. The ZIP was extracted to a separate reference directory; only frontend assets, styles, shared visual components and dependency changes were imported. The original Showonce source and live deployment were not modified. No GitHub branch was pushed.

## Integrated behavior

- `/professional/` preserves the supplied green landing and animated 3D hero. The supplied Hobby face remains at `/` in this local copy.
- `/professional/create/` uses the supplied background, typography, green accents and card/border effects with the real goal, link and private-photo form.
- `/professional/lessons/` displays real saved requests, the four trade courses, enrollment progress, instructor feedback and saved practice sessions.
- `/professional/instructor/` uses real role-protected queue and decision APIs.
- `/professional/lesson/runtime/…` uses the authenticated practice backend with the supplied professional chrome and green palette. The working camera, uploads, questions, image generation, self-review and evidence history remain intact.
- Static sample progress, simulated verdict query states and fake processing/review screens have been replaced by actual API state. Direct sample URLs do not pretend that a saved lesson exists.
- Legacy `/courses/` and `/instructor/` URLs redirect to their new professional equivalents. Professional return/sign-in links remain inside the professional view.
- Professional privacy copy reflects actual private storage and deletion behavior instead of promising that nothing is retained.

No decorative animation was removed. The existing performance fixes, real camera implementation and append-only professional database migrations were retained. Provider credentials were not imported; this local copy still has no Meta key and disables paid controls while allowing free saving and practice. The runtime ceiling remains $5.

## Evidence

- 293 frontend tests and 243 Worker tests pass.
- Production build, credential scan, 16 HTTP routes, 37 Next assets and 31 free API smoke requests pass.
- Browser checks: animated landing on desktop and 390px phone viewport; real photo+goal+link save; private saved-photo retrieval; saved course resumes at checkpoint 2 of 3; library shows 1 of 6 actual course checkpoints.
- At 320px and 390px, the checked screens have no horizontal page overflow; landing CTAs remain inside the phone viewport.
- No real paid AI call was made; provider behavior is covered with fixtures. Physical-phone acceptance remains pending.
