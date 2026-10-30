# ShowOnce ownership and attribution

Copyright © 2026 Robé Berry — application code other than the UI.
Copyright © 2026 Muhammad Hashir (https://github.com/mateir0) — UI.
All rights reserved, subject to existing third-party licenses and agreements.

These attributions follow the ownership information provided by Robé Berry. They do not independently establish ownership or change existing agreements, contributor rights or third-party licenses. Access to this repository does not itself grant permission to redistribute or commercially reuse the owners’ code.

UI attribution covers application pages, components, styles and browser-facing interface files. Backend, application logic and tooling are attributed to Robé Berry. Existing third-party notices take precedence. OriginKit-named components/assets are left without new ownership headers because their upstream rights have not been independently established. JSON, binary and generated files are covered by this notice where applicable rather than invalid inline comments.

## Signed source snapshot

`provenance/source-manifest.json` lists SHA-256 fingerprints. Its Ed25519 signature is `provenance/source-manifest.sig`; the public verification key is `provenance/signing-public.pem`.

Run `node scripts/source-provenance.mjs verify` to verify the signature and all listed file hashes. Run `node scripts/source-provenance.mjs sign` to issue a new snapshot after legitimate changes. The private key stays outside the repository at `~/.showonce-signing/robe-berry-ed25519.pem`. Keep a secure backup of that key and independently retain the public-key fingerprint. Anyone can create a different key; the signature establishes continuity with this key, not independently verified personal identity or legal ownership. Headers and signatures do not prevent copying.
