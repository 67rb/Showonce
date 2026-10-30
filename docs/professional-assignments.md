# Professional assignments — supervised training lifecycle

Added 30 October 2026 on top of the existing enrollment/evidence system
(migration `0015_professional_assignments.sql`, append-only). Assignments do
not replace course enrollments or the legacy course-review flow; they layer a
supervised brief on one enrollment. Legacy enrollments without an assignment
keep their existing behaviour exactly.

## State machine (server-enforced in `professional.mjs`)

```
preparation --(all prep checks saved)--> practice
practice --(submit: practice complete + explicit evidence sharing)--> submitted
submitted --(any criterion: changes_requested)--> changes_requested
changes_requested --(resubmit)--> submitted
submitted --(every required criterion latest decision = approved)--> approved
```

Rules that cannot be bypassed from the client:

- Only an instructor on the server `ADMIN_EMAILS` allowlist can create an
  assignment or assess criteria. Instructors cannot assign or assess their
  own enrollments.
- The rubric (criteria + preparation checks) is frozen as JSON on the
  assignment at creation (`rubric_version: 1`). Decisions always reference
  the frozen criteria; editing a course later never rewrites an assignment.
- Preparation is optimistic-versioned; submitting before every required
  preparation check is complete, or before all course practice is complete,
  returns 409. Submission rechecks the required preparation items from the
  stored record — it never trusts the stored status alone. Optional
  preparation items do not block submission. Self-review acknowledgements
  and AI matches never change assignment status — only criterion
  assessments do.
- Criterion decisions and the resulting assignment status commit in one
  atomic batch: the decision row only lands while the assignment is at the
  assessed version, and the status update only lands if that decision row
  exists. A failed save leaves the assignment unapproved and retryable
  with the same version. Instructors see the learner's submitted
  notes/photos beside each criterion (and general evidence below) before
  deciding; photos load only when opened.
- Submitting requires `share_evidence: true`; it flips the existing
  enrollment evidence sharing on. Revoking sharing afterwards (existing
  endpoint) blocks future instructor evidence reads but cannot retract
  downloads.
- Every criterion decision is append-only history
  (`professional_criterion_decisions`) with the assignment version it was
  made against. The latest decision per criterion decides the outcome.
  `approved` is the only passed state, and only when every required
  criterion's latest decision is approved.
- An enrollment with an unapproved assignment cannot receive a legacy
  course-review decision (409 `assignment_incomplete`), so the two flows
  cannot produce competing passes.
- Evidence may carry a `criterion_id`; the server rejects criteria that are
  not in the frozen rubric (`professional-evidence.mjs`). Notes-only
  evidence is supported where a photo is not appropriate proof.

## Endpoints

| Method | Path | Who |
|---|---|---|
| POST | `/v1/professional/assignments` | Instructor: `{enrollment_id, brief_title, brief_outcome, materials[], criteria[{id,label,required}], prep_checks[{id,label}]}` |
| GET | `/v1/professional/assignments` | Learner: own · Instructor: all |
| GET | `/v1/professional/assignments/:id` | Owner, or instructor once submitted/shared |
| POST | `/v1/professional/assignments/:id/preparation` | Learner: `{expected_version, done[]}` |
| POST | `/v1/professional/assignments/:id/submit` | Learner: `{expected_version, share_evidence:true}` |
| POST | `/v1/professional/assignments/:id/assess` | Instructor: `{criterion_id, decision, notes, expected_version}` |

## Demonstration (automated, synthetic)

`scripts/professional-test.mjs` runs the required demonstration with a
synthetic learner and the allowlisted synthetic instructor on the plumbing
course (paper diagram / disconnected mock rig): assignment creation,
preparation gate (submit fails at 409), lesson practice, criterion-linked
evidence, instructor changes-requested with notes, revised evidence,
resubmission, criterion-by-criterion approval, and the final approved
state. The same test file proves the same lesson (`pro_plumbing_parts`)
explores freely as a plain Hobby session while staying gated inside an
assignment, and that self-assignment/self-assessment are refused.

## Migration and rollback

Migration 0015 only adds tables and one nullable column; applied
migrations 0000–0014 are untouched and existing records need no rewrite.
Rollback: revert the application code to the previous build; the new
tables/column are inert for legacy code, and no enrollment, review or
evidence row is modified by the migration. Deleting the working copy
restores the delivered Integrated tree exactly.

## Limits

- One assignment per enrollment in this version; rubric editing after
  creation is intentionally impossible (create a new assignment on a new
  enrollment to change a rubric).
- Assignment approval is recorded on the assignment, not as a course
  qualification; `qualification:false` remains explicit everywhere.
- Physical-device camera acceptance and qualified curriculum validation
  remain external, pending items.
