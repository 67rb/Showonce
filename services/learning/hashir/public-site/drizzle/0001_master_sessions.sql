-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
CREATE TABLE practice_sessions (id TEXT PRIMARY KEY NOT NULL, lesson_id TEXT NOT NULL, token_hash TEXT NOT NULL, current_index INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE practice_submissions (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES practice_sessions(id), step_id TEXT NOT NULL, idem_key TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL, assessment TEXT, image_key TEXT, mime_type TEXT, created_at INTEGER NOT NULL, UNIQUE(session_id,idem_key));
--> statement-breakpoint
CREATE INDEX practice_submissions_session ON practice_submissions(session_id,status,created_at);
--> statement-breakpoint
CREATE TABLE practice_acknowledgements (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES practice_sessions(id), step_id TEXT NOT NULL, idem_key TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(session_id,idem_key), UNIQUE(session_id,step_id));
--> statement-breakpoint
CREATE TABLE practice_usage (id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES practice_sessions(id), submission_id TEXT NOT NULL UNIQUE, provider TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, estimated_cost_usd REAL, input_tokens INTEGER, output_tokens INTEGER, created_at INTEGER NOT NULL);
