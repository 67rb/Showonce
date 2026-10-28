# Website quality and credential handling

This update preserves the original GitHub visual system and visible animations while improving the real learner flows.

- The animated library background now compiles one program per colour, updates pointer uniforms without React state, releases its frame loop and GPU resources on unmount, pauses when hidden, avoids reallocating an unchanged canvas each frame and bounds framebuffer resolution for long libraries. The GLSL animation itself is unchanged.
- Satin colours are stable across parent renders, and hidden tabs skip satin draws. Original landing particles, sky, gallery, reveal, parallax and CTA animations remain.
- Create explains unavailable AI, offers a prominent free path and provides a free numbered-step fallback after source failures. The original reference remains attached. Polling cancellation removes its listener after each delay.
- Library verification runs at most four browser-practice requests concurrently, keeps prior records visible during refresh/failure, deduplicates paginated records, searches titles and categories, wraps long titles and exposes a filter reset.
- Photo/image/camera AI actions respect setup and the remaining shared allowance. Free examples, numbered-step creation, approved image reads, camera preview, stills and manual comparison stay available.
- Keyboard skip links and visible focus treatment are added without changing the visual layout. Privacy wording now matches private saved-photo storage and temporary local camera stills.

## Credentials

Meta and Supadata credentials are read only by server modules from MODEL_API_KEY and SUPADATA_API_KEY. The browser uses same-origin app endpoints and session/account authorization; it never receives either provider credential. No credential was retrieved, echoed or changed during this work.

`npm run check:secrets` scans browser source, public files, the exported frontend and provider source. It rejects provider-key literals, private keys, credential files in public output, public secret variables and direct provider endpoints in browser code. When secret environment values are available to the build process, it also checks for exact copies. Diagnostics contain only file paths and rule names. `npm run build` and GitHub release checks run this guard.

Worker regression tests use synthetic canaries to verify public config, pages, headers, error responses and inaccessible source paths do not disclose runtime secrets. Provider failures are simulated; no paid API request is needed. Existing origin/session/account and atomic spending checks remain in place.

This guard checks current source and output; it does not rotate credentials or remove previously shared copies. A credential exposed elsewhere should be replaced through the provider and updated only in server secret settings.

## Verification limits

The public website retains its existing sign-in access policy. Local browser checks use the real production Worker with isolated test data and no live provider keys. Physical Android/iPhone camera acceptance remains a separate tester check.
