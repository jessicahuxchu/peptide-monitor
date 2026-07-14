-- Alert Center: assignment + per-person visibility + free-text manual titles

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS title_text TEXT,
  ADD COLUMN IF NOT EXISTS summary_text TEXT,
  ADD COLUMN IF NOT EXISTS created_by_email TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to_email TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;

COMMENT ON COLUMN alerts.title_text IS 'Free-text title for manual alerts; when set, prefers over title_key i18n';
COMMENT ON COLUMN alerts.summary_text IS 'Free-text summary for manual alerts; when set, prefers over summary_key i18n';
COMMENT ON COLUMN alerts.created_by_email IS 'Creator email (Clerk); always retains visibility of own alerts';
COMMENT ON COLUMN alerts.assigned_to_email IS 'Assignee email; NULL = team-wide (all members). Non-null = visible to assignee + creator only';

CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to_email ON alerts (assigned_to_email);
CREATE INDEX IF NOT EXISTS idx_alerts_created_by_email ON alerts (created_by_email);

-- Backfill seed row a4 as Jessica-assigned manual follow-up
UPDATE alerts
SET
  assigned_to_email = 'jessica.huxchu@gmail.com',
  assigned_to_name = 'Jessica',
  created_by_name = COALESCE(created_by_name, 'Steven')
WHERE id = 'a4';
