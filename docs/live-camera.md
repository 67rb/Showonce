# Live camera practice

Open a saved practice, then choose **Practice with live camera · free**. The dedicated `/lesson/runtime/live/` and `/lesson/runtime/play/camera/` routes show the same camera panel. Both require the real lesson and session query parameters.

## Free path

- Camera permission is requested only after **Open camera**.
- Preview, camera switching, still capture, selecting a picture and the comparison checklist call neither Supadata nor Meta.
- Choose **Upload picture** to select one PNG, JPEG or WebP up to 5 MiB. No camera permission is needed. The picture is read locally and shown before checking. Switching sources, stopping, leaving the step or backgrounding clears it.
- Audio is never requested. Preview is not recorded. Comparison stills stay in page memory and clear on stop, hiding the panel, leaving the step or backgrounding the page.
- Works with photo checkpoints and self-review-only numbered lessons. Existing saved lesson art remains the target image.
- Checklist selections express the learner's observations. They never mark a step complete. **I've practiced this step · self-review** saves progress through the existing practice API.
- The local preview can continue if connectivity drops. Saving progress still requires a connection.

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
