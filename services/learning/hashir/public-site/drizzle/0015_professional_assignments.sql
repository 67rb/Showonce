-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
CREATE TABLE professional_assignments (
 id TEXT PRIMARY KEY,
 enrollment_id TEXT NOT NULL UNIQUE REFERENCES professional_enrollments(id),
 owner_id TEXT NOT NULL REFERENCES learner_accounts(id),
 created_by TEXT NOT NULL REFERENCES learner_accounts(id),
 brief_title TEXT NOT NULL,
 brief_outcome TEXT NOT NULL,
 materials_json TEXT NOT NULL,
 criteria_json TEXT NOT NULL,
 prep_json TEXT NOT NULL,
 prep_done_json TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'preparation' CHECK(status IN ('preparation','practice','submitted','changes_requested','approved')),
 version INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX professional_assignments_owner ON professional_assignments(owner_id,updated_at);
--> statement-breakpoint
CREATE TABLE professional_criterion_decisions (
 id TEXT PRIMARY KEY,
 assignment_id TEXT NOT NULL REFERENCES professional_assignments(id),
 criterion_id TEXT NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN ('approved','changes_requested')),
 notes TEXT NOT NULL DEFAULT '',
 reviewer_id TEXT NOT NULL REFERENCES learner_accounts(id),
 assignment_version INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX professional_criterion_decisions_assignment ON professional_criterion_decisions(assignment_id,created_at);
--> statement-breakpoint
ALTER TABLE professional_evidence ADD COLUMN criterion_id TEXT;
