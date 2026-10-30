# Course content versioning and curriculum validation

Status: approach defined 29 October 2026. Starter curricula are labelled
"instructor validation pending" in `professional-catalogue.json`
(`content_status`); no qualified instructor validation is claimed anywhere.

## Immutable content rule

- Lesson IDs in `web/professional-catalogue.json` are immutable once any
  learner record can reference them. Never edit a lesson's steps, criteria or
  expected results in place under the same ID.
- To change content: create a NEW lesson ID (e.g. `pro_plumbing_parts_v2`),
  keep the old lesson retrievable, and point the course's `lesson_ids` at the
  new ID for new enrollments. Existing enrollments and practice sessions keep
  the lesson IDs they started with; their progress is never silently
  invalidated or remapped.
- Course descriptors (title, description, prerequisites) may be clarified
  without a version change only when lesson content and order are untouched.
  Changing lesson order is a content change: it affects prerequisite locks.
- Enrollments store per-lesson progress by lesson ID
  (`professional.mjs`, `drizzle/0012_professional_courses.sql`), so old and
  new lesson versions can coexist in one account's history. Reviews record
  `reviewed_version`; a content change must never rewrite review history.

## What a validated course needs (instructor checklist)

Before `content_status` may drop "instructor validation pending", a qualified
trade instructor must confirm, per lesson:

1. Observable outcomes: each step's expected result is visible in a photo or
   worksheet artifact; nothing is assessed that a photo cannot show.
2. Materials list matches the actual classroom/disconnected setup.
3. Safety boundaries: no energized, pressurized, live-installation or
   otherwise hazardous procedure is taught or implied; prerequisites state
   the classroom limits in plain language.
4. Criteria wording: assessment criteria describe visible facts only and do
   not claim trade-standard correctness, code compliance or competence.
5. Instructor materials: what the reviewer should look for, common learner
   errors, and when to request changes versus approve classroom practice.

## Claim discipline

- AI feedback, self-review and photo matches are practice evidence only.
- `instructor_approved` means an instructor reviewed classroom practice; it
  is recorded distinctly from AI/self states and `qualification:false` stays
  explicit in course responses. Nothing in the app awards a trade
  qualification, licence or safety certification.
