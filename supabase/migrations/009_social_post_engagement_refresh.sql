-- Engagement refresh metadata for social_posts

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS engagement_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_fail_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_social_posts_removed_at
  ON social_posts(removed_at)
  WHERE removed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_engagement_refreshed_at
  ON social_posts(engagement_refreshed_at);
