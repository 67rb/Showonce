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

## Cloud renderer follow-up (2026-10-29)

Cloud frames retain the original shader, resolution, drift equations, damping and frame scheduling. Stable colors and configuration uniforms upload only after a configuration change; viewport/resolution upload only after a backing-size change. This avoids 11 unchanged uniform uploads and four color parses per steady frame. Four moving uniforms still update every frame, and each visible frame is drawn. Pointer bursts retain their latest coordinates and perform one bounds measurement immediately before drawing. Settings changes invalidate the cache on the next frame. Regression tests verify ongoing draws, configuration invalidation, pointer coalescing and resource cleanup. This is a reduction in renderer overhead, not a measured phone FPS claim.

## Readable scrolling follow-up (2026-10-29)

Reveal wrappers keep text opaque and sharp during hydration and scrolling. Entrance translations and stagger remain, beginning 180px before the viewport; they no longer animate a full-section blur or retain opacity/transform/filter will-change textures after settling. Wheel interpolation increases from 0.09 to 0.18 to reduce trailing delay while retaining smooth scrolling. Touch scrolling stays native. All other decorative animations remain.

## Retained sky and pixel parity (2026-10-29)

SkyGate retains its mounted renderer after initialization. The existing visibility scheduler pauses draws outside the hero; scrolling back reuses the canvas, shader program and drift state. This avoids recompilation and resets at the scroll boundary. A regression test verifies canvas identity, one program creation and stopped/resumed draws.

Cloud detail noise only erodes the hashed puff coverage. A non-positive puff cannot become visible, so cloudField skips its eight noise octaves when blob coverage is already non-positive. Cloud resolution, positive-coverage shading, movement and detail parameters are unchanged. Run `python3 scripts/cloud-shader-parity.py`, serve `/tmp/showonce-gpu-parity` over local HTTP, and open it in a WebGL browser. It compares the original and optimized shader output across six configurations, including size extremes, empty coverage and pointer offsets. Local browser result: 589,824 channels compared with zero differences. This tests the local GPU; physical-device acceptance remains separate.

## Page-sized shader cropping and first text (2026-10-29)

The create canvas measured 1280×2106 while the viewport was 1280×720. Satin and library shaders now scissor fragment work to the visible viewport plus 160 CSS pixels on each edge. The framebuffer, uniforms, virtual coordinates, animation and visible resolution stay unchanged; only pixels that cannot currently be seen are omitted. Bounds are cached between scroll/resize/ResizeObserver invalidations. At the measured initial create position the draw region drops from 2106 to 880 rows (58% fewer fragment rows); at a middle scroll position it is at most 1040 rows. This is a draw-area reduction, not an FPS guarantee. Tests cover bottom-origin coordinates, scaling, scroll/resize, offscreen/empty geometry and cleanup.

The public create heading is server-rendered before account/configuration requests finish. Private controls and practice data still wait for account validation. A server-render regression verifies the heading is present with no account requests or private controls.

## Hero scroll crop (2026-10-29)

Live profiling after the user reported residual scroll lag found the hero cloud canvas still rendered its full 2560×1600 buffer when only 368 of 800 CSS rows remained visible at scrollY 432. The cloud renderer now shares the tested viewport crop used by page backgrounds. At that position it draws 1056 backing rows rather than 1600, including 160 CSS pixels of safety margin (34% fewer fragment rows). Resolution, coordinates, shader output and animation remain unchanged. Pointer normalization reuses the same cached bounds, avoiding a second layout measurement. A runtime test verifies the crop follows scrolling without reallocating the framebuffer. This quantifies hidden work removed, not a phone FPS guarantee.
