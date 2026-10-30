-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
CREATE TABLE ai_budget (id INTEGER PRIMARY KEY CHECK(id=1), charged_micro INTEGER NOT NULL DEFAULT 0 CHECK(charged_micro>=0), calls INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE TABLE ai_lessons (id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL);
