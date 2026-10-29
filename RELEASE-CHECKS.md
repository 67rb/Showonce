# Release checks

The workflow runs on pull requests and pushes to master. The frontend job installs
the dependency lock, runs retained component/landing and real API-connected React
tests, exports Next, assembles the combined Worker, smoke-checks it and saves the
combined Worker/migrations as an artifact. The learning job runs original Python
and all Worker/browser/source/illustration regressions plus API deployment smoke.
Failures fail their job; tests require no provider key or paid request.

Optional manual input `public_smoke` checks this build against the published app.
Use the exact production commit; an unpublished candidate should fail its byte
comparison. It makes synthetic free practices and confirms the AI ledger is
unchanged. Sites publication is separate; CI contains no publishing credential.

Local checks:

```sh
npm ci
npm test
npm run build
npm run smoke
cd services/learning
python -m pip install -r hashir/requirements.txt
PYTHONPATH=backend:hashir python -m unittest discover -s backend/tests -v
PYTHONPATH=backend:hashir python -m unittest discover -s hashir/tests -v
cd hashir/public-site
node --test scripts/*test.mjs
node scripts/deployment-smoke.mjs
```

Real Android/Chrome and iPhone/Safari acceptance remains pending tester results.
Synthetic identities, CI and viewport emulation do not establish phone behavior.
