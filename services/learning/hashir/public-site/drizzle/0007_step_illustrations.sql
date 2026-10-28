CREATE TABLE step_illustrations (
 id TEXT PRIMARY KEY,
 lesson_id TEXT NOT NULL,
 step_id TEXT NOT NULL,
 claim_nonce TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('processing','ready','failed')),
 image_key TEXT,
 mime_type TEXT,
 created_at INTEGER NOT NULL,
 UNIQUE(lesson_id,step_id)
);
