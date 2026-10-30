CREATE TABLE professional_requests (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL REFERENCES learner_accounts(id),
 request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 goal TEXT NOT NULL,
 source_url TEXT,
 image_key TEXT,
 mime_type TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','processing','ready','failed')),
 lesson_id TEXT,
 session_id TEXT,
 error_code TEXT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 UNIQUE(owner_id,request_key)
);
CREATE INDEX professional_requests_owner ON professional_requests(owner_id,created_at);
