-- Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md.
CREATE TABLE professional_assignment_leases (
 enrollment_id TEXT PRIMARY KEY REFERENCES professional_enrollments(id) ON DELETE CASCADE,
 nonce TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
