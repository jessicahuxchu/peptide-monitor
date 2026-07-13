-- AI / rules classification metadata for social_posts

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS regulatory_reason TEXT,
  ADD COLUMN IF NOT EXISTS classified_by TEXT CHECK (classified_by IN ('agent', 'rules')),
  ADD COLUMN IF NOT EXISTS au_context BOOLEAN NOT NULL DEFAULT false;
