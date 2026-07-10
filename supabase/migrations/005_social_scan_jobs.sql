-- Tracks async Apify runs for Vercel Cron (start + complete phases).

CREATE TABLE IF NOT EXISTS social_scan_jobs (
  id                TEXT PRIMARY KEY,
  apify_run_id      TEXT NOT NULL,
  dataset_id        TEXT,
  status            TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  error_message     TEXT,
  fetched           INT,
  upserted_posts    INT,
  signals_upserted  INT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_social_scan_jobs_status ON social_scan_jobs(status, started_at DESC);
