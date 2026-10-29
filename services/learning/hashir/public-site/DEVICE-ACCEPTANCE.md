# Physical device acceptance

Public app: https://showonce-practice-studio.jberry1972.chatgpt.site

The user has both Android/Chrome and iPhone/Safari available. Actual results are
**pending**. Browser/VM regression tests and synthetic images do not count as
physical camera or permission evidence. Record the phone model, OS version,
browser version, date, and deployed Site version for each run.

Use paper and a pencil with the free **Sketch a shaded sphere** example. Camera
preview and switching are local and free. Start feedback and Check my work send
images to Meta and use the existing shared trial allowance; stop after one or two
results. Do not point the camera at private material.

| Check | Expected result | Android/Chrome | iPhone/Safari |
|---|---|---|---|
| Sign in/sign up | Managed ChatGPT flow returns to the app; correct account is shown | Pending | Pending |
| Recovery entry | Recover account access opens the provider recovery flow; user handles any credentials | Pending | Pending |
| Deny camera | Useful error; photo/self-review still usable; no feedback request | Pending | Pending |
| Allow camera | Local preview appears only after Open camera | Pending | Pending |
| Switch camera | Old camera stops, another camera opens, feedback remains stopped until Start | Pending | Pending |
| Stop during feedback | Camera indicator clears; late feedback is ignored; no new frames start | Pending | Pending |
| Background/return | Camera stops, private page hides, identity rechecks before progress returns | Pending | Pending |
| Interrupted connection | Clear error and no false checkpoint advance; saved progress can be refreshed | Pending | Pending |
| Photo upload | Allowed image previews, Check my work saves one result; history can reopen it | Pending | Pending |
| Lost response/retry | Same pending action is retried or history is checked; no duplicate advancement | Pending | Pending |
| Cross-device resume | After a free self-review on device A, signing into the same account on B shows that checkpoint | Pending | Pending |
| Sign out/switch | Previous account's library, draft, report and images disappear; new account sees only its own practices | Pending | Pending |

For the network check, turn connectivity off before an acknowledgement, observe
the failure, reconnect and refresh saved progress before retrying. Do not infer
whether a paid request finished from a timeout. For photo or feedback failures,
use the report control and include device/browser details without private images.

No tests have been marked passed from the user's answer “Both”; that answer
confirms available platforms only.
