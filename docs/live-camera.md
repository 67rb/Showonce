# Live camera practice

Open a saved practice, then choose **Practice with live camera · free**. The dedicated `/lesson/runtime/live/` and `/lesson/runtime/play/camera/` routes show the same camera panel. Both require the real lesson and session query parameters.

## Free path

- Camera permission is requested only after **Open camera**.
- Preview, camera switching, still capture, selecting a picture and the comparison checklist call neither Supadata nor Meta.
- Capture a still for free to freeze what the paid check will send. The AI button reads **Check still** while a still is shown, otherwise **Check one frame** captures the current view. Manually capturing a new still resets AI consent so each paid send stays explicit; a fresh frame captured as part of a check you already consented to keeps that consent for the quality gate, offline queue and the send itself.
- While previewing, a free live guide samples the picture locally about once a second and calls out dark, washed-out or blurry framing before you capture. On supported devices it can suggest the torch. Sampling never leaves the device and makes no API calls.
- Where the device reports a zoom range, a Zoom slider appears during preview. Saving the selected still to your own device is a free local download; Show Once still stores nothing from live practice.
- Every capture and upload runs a free local brightness/sharpness check. A dark, washed-out or blurry image shows a free hint and requires ticking **Send anyway** before the paid check can use allowance. The gate never uploads anything. If the free clarity check cannot read an image, a non-blocking notice says it was unavailable — the paid check remains available.
- The panel pins a compact target reference (saved step image when one exists, otherwise the written target) so you can compare without scrolling. Captured stills render side by side with the target image. The image is the same already-loaded target art; the compare view starts no second fetch and no billable request.
- The header badge counts only confirmed paid sends: `0 uploads` until a check succeeds, then `N check(s) sent · not stored`. Failed checks do not increment it. The optional AI section names the shared allowance balance or the reason checks are unavailable.
- Choose **Upload picture** to select one PNG, JPEG or WebP up to 5 MiB. No camera permission is needed. The picture is read locally and shown before checking. Switching sources, stopping, leaving the step or backgrounding clears it.
- Audio is never requested. Preview is not recorded. Comparison stills stay in page memory and clear on stop, hiding the panel, leaving the step or backgrounding the page. The camera component can preserve a queue during a visibility pause, but the full app rechecks account access on return and may remount the practice, clearing it. An explicit stop clears the comparison checklist.
- Works with photo checkpoints and self-review-only numbered lessons. Existing saved lesson art remains the target image.
- Checklist selections express the learner's observations. They never mark a step complete, but checked items are stored with self-review acknowledgements and reports so progress and reviewers share what you confirmed. **I've practiced this step · self-review** saves progress through the existing practice API.
- The local preview can continue if connectivity drops. Saving progress still requires a connection.
- On supported phones the preview offers a torch toggle, tap-to-focus with a visible focus ring, and fullscreen. Tap-to-focus sends the tapped point as normalized `pointsOfInterest` coordinates (0–1 on each axis) with single-shot focus where the device reports that mode. Each control appears only when the device or browser supports it; everything else keeps working where a control is missing.
- When a saved target image exists, **Ghost target over preview** overlays it on the live preview with an opacity slider for alignment. The ghost is local and never sent anywhere.
- Offline, an eligible check can be queued on the device instead of sent. Reconnect, then press **Send queued check** — nothing sends automatically. A fresh capture replaces the queued check. The queue is in memory only. Backgrounding can trigger an account recheck and clear it, as can a reload or step change; the Stop button, switching sources or discarding clears it.

## Optional paid check

The collapsed AI option is separate from free practice. Opt in, then explicitly click **Check one frame · uses AI allowance** to send one frame to the existing authenticated assessment endpoint. For an uploaded picture, opt in and click **Check uploaded picture · uses AI allowance**. That check sends the exact displayed picture, preserving its MIME type; no camera frame is substituted. No polling, automatic repeated capture or automatic advancement. The server's shared US$5 ledger remains authoritative; this release does not change billing, buy credits or reset spend.

Camera frames and pictures sent through this live-practice check are not stored by Show Once. The separate **Check my work** photo submission path still saves photos privately with history. The existing backend privately retains feedback (last 20 records per session). Stopping aborts the client wait and ignores late feedback; an already submitted provider request can still incur cost. AI checks are disabled when setup, budget or connectivity is unavailable and absent for self-review-only steps.

## Image-based answers

The actual image and the authoritative current step are sent as separate text/image inputs to Meta vision. The model is instructed to assess only visible facts, ignore instructions embedded in the image, and return specific evidence, corrections or a request for a clearer image. A blurred or irrelevant image must not be treated as proof. These checks judge the current checkpoint; they are not a general visual chat or a continuous recording. Self-review steps offer local image comparison without an AI judgement.

Replacing an image clears previous feedback, invalidates pending file reads and aborts waiting for old AI results. A provider call already sent can still use allowance. No automatic repeat checks are started.

## Device acceptance checklist (copy for testers)

Test on Android/Chrome and iPhone/Safari. Send your phone model, OS version, browser version and pass/fail notes for each item. Use the free drawing example or free numbered steps. Skip the optional AI section to keep the test free.

1. Open a practice. Expand live camera. Confirm there is no permission prompt before tapping Open camera.
2. Deny permission. Confirm the recovery message appears and self-review remains usable. Allow camera access in site settings, return, tap Open camera and confirm the picture appears.
3. Tap Switch camera. Confirm the other camera opens when present and the previous camera releases. Devices with one camera may keep the same view.
4. Capture a free still. Confirm it appears, compare it with the written target and try the checklist. Discard the still, then capture another.
5. Tap Stop camera. Confirm the preview stops, the still disappears and the browser camera indicator turns off (unless another app/tab is using it).
6. Open again, background the browser, then return. Confirm the camera stays stopped until you open it again.
7. Disconnect the network with the camera open. Confirm preview and still capture work. Reconnect before saving progress.
8. Self-review the step. Confirm progress saves once and the camera stops. Open another checkpoint and confirm the previous still/checklist are gone.
9. Hide the camera panel, leave the practice, and sign out. Confirm no camera remains active or previous still remains visible.
10. Choose Upload picture with the camera stopped. Select a PNG/JPEG/WebP under 5 MiB. Confirm a local preview appears without a camera prompt or AI call. Replace/discard it. Try an unsupported file and confirm a useful error. Skip the paid check to keep this test free.
11. On desktop, if available, disconnect an external camera while previewing. Confirm the reconnect message appears and a fresh Open camera works after reconnecting.

Automated tests cover fake devices and delayed permission/AI replies. They do not replace these physical-device checks. No real paid AI call was made during development verification.
