# Performance with the original motion

This pass changes when redundant work runs, not the visual design or quality settings. There are no CSS, font, layout, colour, shader-program, particle-count, resolution, animation-speed, easing, gallery-tilt or CTA-strand changes.

## Changes

- Particle text draws once at exact rest, then requests another frame only when pointer input or existing particle motion needs it. Every particle and force/integration statement is retained. There is no epsilon, coordinate snapping or approximation. After an interaction, any nonzero residual motion continues normally.
- Consecutive particles with the same colour reuse the canvas fill style. Draw order and each rectangle remain unchanged. The mask is read once using a normal 2D canvas context rather than marking the drawing canvas for frequent readback.
- A shared visibility scheduler cancels canvas frame callbacks when offscreen or in a hidden document. It retains particle state, wakes for input, resumes without duplicate loops and disposes its observers/listeners. Satin and cloud canvases use it as well.
- The goo button reuses its measured relative geometry while stable. Every changed inline press/release transform is still measured; the button and its container are both observed for independent resizing. Its existing spring, physics, shaders and drawing routines remain.
- Hidden documents pause the shared smooth-scroll loop and the button loop. Visible scrolling and per-frame animations keep their previous settings and cadence.
- Cloud resources (program, shaders and buffer) are released when the hero unmounts. Its GLSL is unchanged; contexts are not forcibly lost.

## Verification

Unit regressions verify exact resting particle positions, a known hover trajectory, one mask sample across pause/resume, no duplicate loops, hidden/offscreen cleanup, precise button measurements throughout changed press transforms and remeasurement on resize. Existing functional, budget, account and credential checks remain required.

Browser measurements use the real local production Worker, with no provider key, at a fixed desktop viewport. Main-thread ScriptDuration/TaskDuration and layout counts are recorded before and after with Chrome's performance counters. CPU sampling is enabled in both hero measurements. Results are normalized by each observation's wall-clock duration. These are local diagnostic samples, not a cross-device FPS guarantee or a controlled mobile benchmark. Cloud/word animation phases naturally differ between screenshots.

Visual checks compare the same geometry, rendered markup and shader programs. The original hero wrappers, gallery implementation and global/runtime CSS are byte-identical to the previous release. Physical phone performance still needs tester evidence; GPU-heavy full-quality effects remain enabled by design.
