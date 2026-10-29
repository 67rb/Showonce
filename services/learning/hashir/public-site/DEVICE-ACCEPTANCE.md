# Physical device acceptance

Public app: https://showonce-practice-studio.jberry1972.chatgpt.site

The user has both Android/Chrome and iPhone/Safari available. Actual results are
**pending**. Browser/VM regression tests and synthetic images do not count as
physical camera or permission evidence. Record the phone model, OS version,
browser version, date, and deployed Site version for each run.

Use paper and a pencil with the free **Sketch a shaded sphere** example. Camera
preview and switching are local and free. The optional AI check (one frame or
one uploaded picture, only after opt-in and an explicit check click) and Check
my work send images to Meta and use the existing shared trial allowance; stop
after one or two results. Do not point the camera at private material.

| Check | Expected result | Android/Chrome | iPhone/Safari |
|---|---|---|---|
| Sign in/sign up | Managed ChatGPT flow returns to the app; correct account is shown | Pending | Pending |
| Recovery entry | Recover account access opens the provider recovery flow; user handles any credentials | Pending | Pending |
| Deny camera | Useful error; photo/self-review still usable; no AI check is sent | Pending | Pending |
| Allow camera | Local preview appears only after Open camera; no permission prompt before that tap | Pending | Pending |
| Switch camera | Old camera stops, another camera opens; preview mirroring matches the newly opened camera | Pending | Pending |
| Live guide | During preview, the free live guide calls out dark, washed-out or blurry framing locally before any capture, with no AI request | Pending | Pending |
| Quality gate | A dark, washed-out or blurry still or upload shows a free hint and needs Send anyway before a paid check; if the free clarity check cannot read the image, a non-blocking notice says it was unavailable and the paid check still works | Pending | Pending |
| Torch | On devices reporting a torch, Torch on/off changes the light and the preview keeps working | Pending | Pending |
| Tap-to-focus | On devices reporting single-shot focus, tapping the preview shows the focus ring at the tap and refocuses using that tapped point | Pending | Pending |
| Fullscreen | Fullscreen opens the preview where the browser allows it, or shows a clear unavailable message | Pending | Pending |
| Ghost target | With a saved target image, the ghost overlays the preview and its opacity slider adjusts it; the ghost is never sent | Pending | Pending |
| Thirds grid | The grid overlays the preview only and can be toggled off | Pending | Pending |
| Zoom | On devices reporting a zoom range, the slider changes the preview zoom | Pending | Pending |
| Resolution | Switching 720p/1080p applies to the live preview or the next open, and is remembered until sign-out or account change | Pending | Pending |
| Self-timer | The 3-second countdown captures a still; cancelling, stopping or starting a paid check prevents the timer capture | Pending | Pending |
| Save still | Save still downloads the selected still to the device with no upload | Pending | Pending |
| Capture and compare stills | Capture still is free, up to three stills are kept, selecting a still does not change during a paid check, and the selected still is what a paid check sends | Pending | Pending |
| Optional AI check badge | The badge counts only confirmed sends; a failed check does not increment it and free flows make no AI request | Pending | Pending |
| Stop during a check | Camera indicator clears; late feedback is ignored; no new frames start | Pending | Pending |
| Background/return | Camera and stills stop on backgrounding, while a queued check, its consent and the checklist survive in the same tab; no camera restarts until Open camera is tapped again | Pending | Pending |
| Offline queue | Offline, an eligible check queues locally instead of sending; reconnecting does not send it automatically — only Send queued check does. The queue does not survive a reload or step change | Pending | Pending |
| Interrupted connection | Clear error and no false checkpoint advance; saved progress can be refreshed | Pending | Pending |
| Photo upload | Allowed image previews, Check my work saves one result; history can reopen it | Pending | Pending |
| Lost response/retry | Same pending action is retried or history is checked; no duplicate advancement | Pending | Pending |
| Cross-device resume | After a free self-review on device A, signing into the same account on B shows that checkpoint | Pending | Pending |
| Sign out/switch | Previous account's library, draft, report, images and saved camera/resolution preferences disappear; new account sees only its own practices | Pending | Pending |

For the network check, turn connectivity off before an acknowledgement, observe
the failure, reconnect and refresh saved progress before retrying. Do not infer
whether a paid request finished from a timeout. For photo or camera-check
failures, use the report control and include device/browser details without
private images.

No tests have been marked passed from the user's answer “Both”; that answer
confirms available platforms only.
