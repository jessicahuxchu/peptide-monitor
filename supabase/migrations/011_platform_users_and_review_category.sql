-- Platform users + role assignments; inbox review category for confirm ACL

CREATE TABLE IF NOT EXISTS platform_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  roles      TEXT[] NOT NULL DEFAULT '{}',
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_users_roles_valid CHECK (
    roles <@ ARRAY['admin', 'procurement', 'sales', 'ops']::TEXT[]
  )
);

CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users (email);
CREATE INDEX IF NOT EXISTS idx_platform_users_active ON platform_users (active);

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON platform_users FOR SELECT USING (true);

-- Bootstrap Admin (Jessica). Roles can be extended in Admin Portal.
INSERT INTO platform_users (email, name, roles)
VALUES (
  'jessica.huxchu@gmail.com',
  'Jessica',
  ARRAY['admin']::TEXT[]
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  roles = (
    SELECT ARRAY(
      SELECT DISTINCT r
      FROM unnest(platform_users.roles || EXCLUDED.roles) AS r
    )
  ),
  active = true,
  updated_at = now();

ALTER TABLE agent_submissions
  ADD COLUMN IF NOT EXISTS review_category TEXT NOT NULL DEFAULT 'admin';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_submissions_review_category_check'
  ) THEN
    ALTER TABLE agent_submissions
      ADD CONSTRAINT agent_submissions_review_category_check
      CHECK (review_category IN ('procurement', 'sales', 'admin'));
  END IF;
END $$;

COMMENT ON COLUMN agent_submissions.review_category IS
  'Who may confirm: procurement (supplier quotes), sales (customer inquiries), admin (regulatory/other). Admin role always can confirm.';
