# Show Once — Hashir's contribution

Standalone tutorial processing, photo assessment, sampled-frame processing, and a
responsive **app-screen/component preview**. Master's backend files are unchanged.
Python 3.11+ follows the repository's existing stack; plain HTML/CSS/JS keeps this
preview independent of Steven's production frontend. Pillow verifies actual image
decoding; JSON Schema validates module boundaries.

## Start here

Run from the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r hashir/requirements.txt
PYTHONPATH=hashir .venv/bin/python -m showonce_ai demo
```

Open **http://127.0.0.1:8011**. Paste the prefilled supported URL, start the
lesson, choose **Correct fold** under the sample picker, then **Check my work**.
Continue through seven checkpoints. On step 1, try wrong, blurry, unrelated, and
obstructed samples. Other uploads return uncertain in mock mode. **Live feedback**
feeds synthetic frames; it does not request camera access. **Explore states**
shows every loading, feedback, completion, and error design.

This loopback demo has no persistence. Local Next buttons demonstrate navigation;
Master's session backend owns actual saved progress. Sidebar steps are previews.
Restarting/reloading resets local state. By default, no credentials or paid services are used.

## Commands

```sh
# Complete offline photo smoke test (seven passes plus four alternative cases)
PYTHONPATH=hashir .venv/bin/python -m showonce_ai smoke

# Grounded lesson JSON from the authored offline fixture
PYTHONPATH=hashir .venv/bin/python -m showonce_ai ingest

# Explicit public-network fetch of the ONE supported source; no AI inference
PYTHONPATH=hashir .venv/bin/python -m showonce_ai ingest --fetch-live

# Three frames: retry, uncertain, pass; includes latency and usage
PYTHONPATH=hashir .venv/bin/python -m showonce_ai live-demo

# AI tests, including integration with the existing backend interfaces
PYTHONPATH=hashir:backend .venv/bin/python -m unittest discover -s hashir/tests -v

# Master's original regression suite
PYTHONPATH=backend .venv/bin/python -m unittest discover -s backend/tests -v

# Executable nightly handoff: temporary SQLite + actual backend progress rules
PYTHONPATH=hashir:backend .venv/bin/python hashir/examples/master_wiring.py
```

## Optional NVIDIA inference

`NvidiaVision` implements the same interface as the fixture provider. It sends a
single image to NVIDIA NIM using the documented image/text chat-completions shape.
It does not assume native video, tools, or provider-enforced JSON Schema. Output
JSON is parsed and checked locally. No SDK is required.

Export `NVIDIA_API_KEY` **only on the server**, then explicitly opt into one call:

```sh
PYTHONPATH=hashir .venv/bin/python -m showonce_ai assess-live \
  --image hashir/fixtures/images/cup_01_correct.png --step 1 --allow-one-paid-call
```

The key is never read by the demo browser or demo endpoints. See
[provider verification](docs/PROVIDERS.md) and [environment placeholders](.env.example).
No NVIDIA inference call was made. NVIDIA entitlement, price, latency under
load, model reliability, and account quotas remain unverified. This adapter is
available for a deliberate test, not a claim of validated accuracy. The Meta adapter below is separate; Nebius is not wired. Credit eligibility is not assumed across providers.

## Meta vision — authorized US$5 local allowance

Meta is now connected through a separate `MetaVision` adapter. The key stays in an
ignored server-only `.env` file (mode 0600) or `MODEL_API_KEY`; it is never served.
The standard `muse-spark-1.3` model uses structured vision output. Real calls on
synthetic diagrams produced a useful retry and an obstructed-view uncertain
result; this is connection evidence, not a real-photo accuracy evaluation.

```sh
# Enable real Meta photo and sampled-frame feedback in the local preview
PYTHONPATH=hashir .venv/bin/python -m showonce_ai demo --provider meta --env-file hashir/.env

# One deliberate inference call
PYTHONPATH=hashir .venv/bin/python -m showonce_ai assess-live --provider meta \
  --env-file hashir/.env --image hashir/fixtures/images/cup_01_mistake.png \
  --step 1 --allow-one-paid-call

# Report the persistent allowance without making a provider request
PYTHONPATH=hashir .venv/bin/python -m showonce_ai budget
```

The same ledger is shared across these commands and concurrent server calls.
Before each generation, Meta counts the input and the adapter reserves the upper
cost including capped output/reasoning tokens. Crashes/timeouts keep the full
reservation. No automatic retries or tools are enabled. State-explorer photo
assessments remain mock-only and free even in Meta mode. Normal Check my work and
live Start use the provider shown in the banner. Starting the live loop consumes
the allowance until stopped or the ledger refuses further calls.

The US$5 guard applies to calls through this adapter and its default ledger,
`data/hashir-meta-budget.sqlite3`; it is not an account-wide Meta spending limit.
Do not delete/reset the ledger or select a different path to bypass this allowance.
Estimates use verified token prices; provider billing is authoritative. See
[Meta setup, billing and validation](docs/META.md).

## Handoff

- [Contracts and module boundaries](docs/CONTRACTS.md) — existing API v1 compatibility and proposed extensions.
- [Design specifications](docs/DESIGN.md) — tokens, responsive behavior, every screen/state, keyboard rules.
- [Nightly integration](docs/HANDOFF.md) — Steven/Master examples, checklist and open decisions.
- [Implementation and validation record](docs/STATUS.md) — tested behavior and material limits.
- [Fixture provenance](fixtures/PROVENANCE.md) — authored source paraphrase and synthetic images.
- [Example JSON](examples/) — lesson, assessment requests/results, frame/event and error.

`hashir.ai.v1-proposed` is a proposal for team agreement. No teammate acceptance,
production integration, trade-content review, or real model accuracy is implied.

## Public multi-skill app

The public app has now moved beyond the original origami-only fixture:
https://showonce-practice-studio.jberry1972.chatgpt.site

It accepts supported HTML tutorial links or pasted instructions/transcripts for
other skills. Free examples include drawing, crochet, origami and music; free
numbered-step mode preserves custom instructions without AI spending. Live image
feedback uses the generated lesson's own criteria. Nonvisual steps use explicit
self-review. The public US$1 trial allowance is reserved inside the original US$5
limit, not additional spending. See [multi-skill handoff](docs/MULTISKILL.md) and
[deployment/verification record](docs/PUBLISHING.md). Public source/build files are
in `public-site/`; existing Python modules and the team's backend are preserved.
