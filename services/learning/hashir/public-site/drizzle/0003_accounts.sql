CREATE TABLE learner_accounts (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, display_name TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
--> statement-breakpoint
ALTER TABLE ai_lessons ADD COLUMN owner_id TEXT REFERENCES learner_accounts(id);
--> statement-breakpoint
ALTER TABLE practice_sessions ADD COLUMN owner_id TEXT REFERENCES learner_accounts(id);
--> statement-breakpoint
ALTER TABLE practice_sessions ADD COLUMN total_steps INTEGER CHECK(total_steps IS NULL OR total_steps>0);
--> statement-breakpoint
CREATE INDEX practice_sessions_owner_created ON practice_sessions(owner_id,created_at,id);
