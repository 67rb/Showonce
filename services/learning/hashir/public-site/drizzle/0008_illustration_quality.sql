-- Keep old images and billing records for audit, but never serve unchecked v1 art.
CREATE TABLE illustration_candidates (
 id TEXT PRIMARY KEY,
 lesson_id TEXT NOT NULL,
 step_id TEXT NOT NULL,
 claim_nonce TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('processing','ready','failed')),
 image_key TEXT,
 mime_type TEXT,
 review_json TEXT,
 created_at INTEGER NOT NULL,
 UNIQUE(lesson_id,step_id)
);
