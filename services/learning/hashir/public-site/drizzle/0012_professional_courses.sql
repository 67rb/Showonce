CREATE TABLE professional_enrollments (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES learner_accounts(id),
 course_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'learning' CHECK(status IN ('learning','pending_review','changes_requested','instructor_approved')),
 version INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(owner_id,course_id)
);
CREATE INDEX professional_enrollments_owner ON professional_enrollments(owner_id,updated_at);
CREATE TABLE professional_reviews (
 id TEXT PRIMARY KEY,
 enrollment_id TEXT NOT NULL REFERENCES professional_enrollments(id),
 reviewer_id TEXT NOT NULL REFERENCES learner_accounts(id),
 decision TEXT NOT NULL CHECK(decision IN ('changes_requested','instructor_approved')),
 notes TEXT NOT NULL,
 reviewed_version INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 UNIQUE(enrollment_id,reviewed_version)
);
