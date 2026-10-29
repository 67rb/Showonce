CREATE TABLE practice_questions (
 id TEXT PRIMARY KEY NOT NULL,
 session_id TEXT NOT NULL REFERENCES practice_sessions(id),
 step_id TEXT NOT NULL,
 idem_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 question TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('processing','answered','failed','deleted')),
 answer_json TEXT,
 error_code TEXT,
 created_at INTEGER NOT NULL,
 finished_at INTEGER,
 UNIQUE(session_id,idem_key)
);
--> statement-breakpoint
CREATE INDEX practice_questions_session_step ON practice_questions(session_id,step_id,created_at);
