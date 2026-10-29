# Accounts, catalogue, reports and acceptance

The existing practice interface is retained. The added controls use its existing
components. `/team.html` is a separate internal interface, protected on every API
request by Sites identity and the explicit `ADMIN_EMAILS` runtime secret.

## Identity and practices

Sites dispatch owns sign-in, sign-up, sign-out and recovery. Normal top-level
anchors use `/signin-with-chatgpt` and `/signout-with-chatgpt`. Recovery happens in
the ChatGPT sign-in flow; Show Once does not store passwords or send recovery
emails. The stable Site subject is hashed into an internal account ID. Only the
dispatch-injected identity headers are trusted. The public deployment smoke
checks that caller-supplied identity headers are removed by the hosting boundary.

The library API returns at most 25 owned practices per page. Account sessions and
generated source lessons require their owning identity, including when an old
browser capability is known. Signing in does not silently attach browser-only
practices: the learner verifies and explicitly connects each one. An attached
practice retains its original progress, and its old capability no longer grants
anonymous access. Account practices keep no capability snapshot in localStorage.

The frontend hides private work while rechecking identity, clears lesson/source/
report/photo/history state on an account change, and ignores late responses from
previous accounts. Returning from a background tab revalidates identity and
authoritative progress. Browser practices are verified with the server before
cached titles are shown. Storage failure retains new guest access in memory with
a warning; signing in can save that access to the account explicitly.

## Catalogue

The team can create a lesson, edit title/category/materials/difficulty/source
attribution, save a draft, and explicitly publish or unpublish it. The current
checkpoint content is retained unless replacement numbered instructions are
entered; replacements create self-review checkpoints without a model request.
Existing photo examples retain their photo criteria. Source credit is displayed
to learners. The editor does not claim to transcribe video or generate photo
criteria for newly entered numbered steps.

Each save creates an immutable lesson revision. A version guard prevents lost
edits. Publication switches a pointer, so an active learner keeps the lesson and
step IDs they started with. An unpublished or draft revision cannot start a new
public practice; its existing owners can still resume it. Library attachment
also works for an earlier unpublished practice. The catalogue is bounded to
1,000 entries, paginated 25 at a time. Public listing uses a joined query rather
than one database request per managed lesson.

## Reports

Learners can report instructions, AI feedback, a broken source, or another issue
from a saved practice. A report stores its reason, optional description, lesson,
checkpoint, source attribution and deliberately selected feedback. Photos and
session access are excluded. Camera feedback text is retained for the last 20
frames per practice so its server-owned result can be reported; camera frames
are not retained. A report copies its selected result so later feedback cannot
overwrite the evidence. The team sees only the reported checkpoint snapshot,
not general access to private lessons, practices or photos.

Retrying a report uses the same body and idempotency key. Limits are 10 new
reports per practice and 30 per signed-in account in 24 hours. Review statuses
are open, triaged, resolved and dismissed; internal notes and a version guard
prevent reviewers overwriting each other.

## Release checks

`node scripts/deployment-smoke.mjs` starts a loopback-only HTTP server around the
built Worker with migrated disposable storage. It runs 31 HTTP requests for
readiness, access isolation, free progress, replay, invalid camera inputs and
exact built assets. There is no model key or paid provider call. A separate
`production-smoke.mjs` checks the actual HTTPS deployment and host identity
boundary. The original Master Python implementation remains unchanged.

GitHub integration belongs in the user's private `67rb/Showonce` repository,
under `services/learning/`; its existing Next frontend stays separate. The
workflow runs frontend tests/build/standalone smoke plus original Python tests,
Worker tests/build/HTTP smoke and saves the Worker artifact. A manual option can
check a matching build against the published Site, without a provider key.
Normal CI does not deploy or reserve money. Actual Actions execution and physical
phone results must be recorded separately; having a workflow is not evidence
that a run passed.

## Verification boundaries

Tests with synthetic managed identities verify application ownership rules,
not real sign-in/recovery or physical cameras. Local browser testing uses the
explicit loopback `--admin-fixture` preview flag, with disposable data and no key.
The production Worker contains no fake sign-in route. Real Android/Chrome and
iPhone/Safari acceptance is tracked in `DEVICE-ACCEPTANCE.md`. Device availability
is not a passing result.
