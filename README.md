# SHOW ONCE

The GitHub landing page and frontend, connected to the complete learning service.
Create lessons from supported tutorials, public demonstrations or pasted text,
practice step by step, check visible work with AI, and resume saved progress.

Live app: https://showonce-practice-studio.jberry1972.chatgpt.site

## Run locally

Node.js 24 or newer is required:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The dev command starts Next and the isolated learning
API. Local storage is disposable, there is no live model key, and managed sign-in
is available on the published Site. Free examples and numbered steps work locally.

For the complete frontend and Worker build:

```sh
npm test
npm run build
npm run smoke
npm start
```

The combined preview runs at http://127.0.0.1:3000 with disposable storage and no
AI key. Hosted production uses managed D1/R2, Sites identity and existing secrets.
Do not expose the local preview as production.

## Included

- Original landing design and component system.
- Real lesson creation, free examples and numbered steps.
- Accounts/recovery entry, cross-device libraries and account isolation.
- Server-owned progress, self-review, photo and sampled camera feedback.
- Camera switching and Stop; history and private photo viewing/deletion.
- Learner reports, internal catalogue publication and report review.
- Optional target illustrations, visual video learning and source attribution.
- Original Python backend, AI modules, schemas, fixtures and regression tests.

Submitted photos are stored privately until deleted from history. Sampled camera
frames are not stored. Feedback does not certify competence or safety.

See [INTEGRATION.md](INTEGRATION.md), [RELEASE-CHECKS.md](RELEASE-CHECKS.md), and
`services/learning/hashir/public-site/` for implementation and acceptance details.
