# YouTube caption fallback

When free Supadata processing is unavailable, transcript mode tries public
YouTube captions without sending a provider key or starting paid extraction.
Visual mode keeps its meaning: after a quota/setup error, the learner can select
**Use spoken captions instead**, then explicitly retry **Get the steps**.
The notice explains that captions do not analyse visual actions and that creating
an AI lesson still uses the existing app allowance.

Reliability fixes:

- Try up to three distinct public tracks, preferring English human captions,
  then English automatic captions. One inaccessible track does not stop recovery.
- Only HTTPS YouTube `/api/timedtext` URLs for the requested video are accepted.
  Redirects are not followed and no provider credentials are attached.
- Streamed responses are bounded: watch page 3 MB, caption JSON 1 MB, and one
  20-second deadline. Unusable responses preserve the original quota message.
- Existing failed quota records can still be rescued; captions are cached as
  transcript evidence and never represented as observed video actions.

Verification: 335 frontend tests plus OAuth fixtures, 270 Worker tests, production
Vercel build and credential scan, 16-route/31-API smoke checks, real Node-handler
checks. Tests reproduce a failed preferred track with a usable alternative,
reject foreign/wrong-video caption URLs, cancel oversized bodies, and verify the
explicit visual-to-caption UI retry without a paid call.

A live anonymous public-caption check for `aAxGTnVNJiE` did not expose usable
captions in this environment. Supadata exhaustion was simulated only for the
account check; YouTube was fetched live. No real paid provider was called.
YouTube may restrict automated access, lack captions, or require consent. This
fallback is conditional; paste instructions and free numbered steps remain
available. Instagram and TikTok do not use this YouTube-only fallback.

The server-only API keys and the existing US$5 runtime cap are unchanged.
