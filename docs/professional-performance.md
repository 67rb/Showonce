# Professional UI performance — 29 October 2026

This pass retains the supplied geometry, animation, shader resolution, glow, card hover effects and scrolling design. It changes only the professional copy and shared components inside that copy.

- The 3D hero now cancels its frame schedule when offscreen or the document is hidden, resumes its clock without a jump, and renders reduced-motion preferences only on invalidation. Preferences can change while the page is open. A lifecycle test verifies pause/resume, disposal and reduced-motion behavior.
- Static shader/camera parameters are applied only when props or dimensions change, rather than every animation frame.
- The rock shader skips lava-noise calculations where heat is exactly zero and vein-mask calculations where both visible contributions are exactly zero. Geometry and visible effects are retained.
- Moving gallery cards no longer blur an already opaque backing. Gradients, shadows, highlights, saturation and hover motion remain. This produces a very small edge difference rather than a different card design.
- Parallax avoids repeated layout reads while the scroll position is unchanged, and invalidates on route, intersection, window size or body size changes.

## Verification and practical limits

296 frontend tests, the production build, credential scan, 16 HTTP routes, 37 Next assets and 31 free API smoke checks pass. New tests check that hidden animations actually stop scheduling, motion resumes without a time jump, and reduced-motion invalidation behaves correctly. No provider calls were made.

The normal browser animation setting was restored after deterministic screenshot testing. The 953×720 frozen-hero reference matched exactly (zero changed pixels). For the card capture, mean channel difference was 0.101 of 255, with changes concentrated near the card boundaries. Evidence: `exports/professional-performance-visual-parity.json` in the parent workspace.

Same-local-browser profiling, in milliseconds of main-thread work per elapsed second:

| Section | Before | After |
| --- | ---: | ---: |
| Visible hero | 189.3 | 161.7 |
| Scrolled cards section | 210.8 | 138.0 |

The scrolled-section sample showed about 35% lower main-thread work. These are indicative CPU samples with unequal observation durations, not controlled hardware benchmarks or a claim of a particular FPS on every phone. Device acceptance remains a separate check. Detailed samples are in `exports/professional-performance-profile.json` in the parent workspace.
