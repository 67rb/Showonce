CREATE TABLE catalogue_entries (id TEXT PRIMARY KEY NOT NULL, draft_lesson_id TEXT, published_lesson_id TEXT, version INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE catalogue_revisions (lesson_id TEXT PRIMARY KEY NOT NULL REFERENCES ai_lessons(id), entry_id TEXT NOT NULL REFERENCES catalogue_entries(id), created_by TEXT NOT NULL REFERENCES learner_accounts(id), created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX catalogue_revision_entry ON catalogue_revisions(entry_id,created_at);
--> statement-breakpoint
CREATE TABLE learner_reports (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES practice_sessions(id), lesson_id TEXT NOT NULL, step_id TEXT NOT NULL, reporter_id TEXT, reason TEXT NOT NULL, details TEXT NOT NULL, context TEXT NOT NULL, idem_key TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','triaged','resolved','dismissed')), review_notes TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(session_id,idem_key));
--> statement-breakpoint
CREATE INDEX learner_reports_queue ON learner_reports(status,created_at,id);
--> statement-breakpoint
CREATE INDEX learner_reports_rate ON learner_reports(session_id,created_at);
--> statement-breakpoint
CREATE TABLE practice_camera_feedback (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES practice_sessions(id), step_id TEXT NOT NULL, assessment TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX practice_camera_feedback_session ON practice_camera_feedback(session_id,created_at,id);
