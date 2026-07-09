-- Reddit / social raw posts (feeds heat aggregation → intelligence_signals)

CREATE TABLE IF NOT EXISTS social_posts (
  id              TEXT PRIMARY KEY,
  platform        TEXT NOT NULL DEFAULT 'reddit',
  external_id     TEXT NOT NULL,
  subreddit       TEXT,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL DEFAULT '',
  score           INT NOT NULL DEFAULT 0,
  num_comments    INT NOT NULL DEFAULT 0,
  author          TEXT,
  permalink       TEXT NOT NULL,
  url             TEXT NOT NULL,
  posted_at       TIMESTAMPTZ NOT NULL,
  products        JSONB NOT NULL DEFAULT '[]',
  has_regulatory  BOOLEAN NOT NULL DEFAULT false,
  engagement      INT NOT NULL DEFAULT 0,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_engagement ON social_posts(engagement DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_has_regulatory ON social_posts(has_regulatory)
  WHERE has_regulatory = true;
