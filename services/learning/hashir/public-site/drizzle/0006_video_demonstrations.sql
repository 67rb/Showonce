ALTER TABLE source_extractions ADD COLUMN job_kind TEXT NOT NULL DEFAULT 'transcript';
--> statement-breakpoint
ALTER TABLE source_extractions ADD COLUMN metadata_json TEXT;
