-- TASK-071: dispatch list read model (local/staging)
CREATE TABLE IF NOT EXISTS dispatch_recipients (
  portal_id TEXT PRIMARY KEY,
  counselor_uid TEXT NOT NULL,
  assessment_id TEXT NOT NULL,
  display_name TEXT,
  notify_status TEXT,
  test_status TEXT,
  completed_count INT DEFAULT 0,
  required_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_recipients_assessment
  ON dispatch_recipients (assessment_id, counselor_uid, display_name);
