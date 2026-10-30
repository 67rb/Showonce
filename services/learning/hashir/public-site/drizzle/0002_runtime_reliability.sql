-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
ALTER TABLE ai_budget ADD COLUMN paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1));
--> statement-breakpoint
CREATE TABLE ai_reservations (id TEXT PRIMARY KEY NOT NULL, claim_nonce TEXT NOT NULL, maximum_micro INTEGER NOT NULL CHECK(maximum_micro>0), charged_micro INTEGER NOT NULL CHECK(charged_micro>=0), status TEXT NOT NULL CHECK(status IN ('reserved','settled','usage_mismatch')), input_tokens INTEGER, output_tokens INTEGER, created_at INTEGER NOT NULL, settled_at INTEGER);
--> statement-breakpoint
CREATE TABLE practice_live_leases (session_id TEXT PRIMARY KEY NOT NULL REFERENCES practice_sessions(id), claim_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)));
