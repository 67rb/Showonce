-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
ALTER TABLE professional_requests ADD COLUMN trade TEXT NOT NULL DEFAULT 'Other trade';
ALTER TABLE professional_requests ADD COLUMN experience_level TEXT NOT NULL DEFAULT 'beginner';
ALTER TABLE professional_requests ADD COLUMN success_criteria TEXT NOT NULL DEFAULT '';
ALTER TABLE professional_enrollments ADD COLUMN evidence_shared INTEGER NOT NULL DEFAULT 0;
CREATE TABLE professional_evidence (
 id TEXT PRIMARY KEY,
 enrollment_id TEXT NOT NULL REFERENCES professional_enrollments(id),
 owner_id TEXT NOT NULL REFERENCES learner_accounts(id),
 lesson_id TEXT NOT NULL,
 notes TEXT NOT NULL,
 image_key TEXT,
 mime_type TEXT,
 request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('uploading','ready','failed','deleted')),
 created_at INTEGER NOT NULL,
 UNIQUE(enrollment_id,request_key)
);
CREATE INDEX professional_evidence_enrollment ON professional_evidence(enrollment_id,created_at);
