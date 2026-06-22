-- Peptide Command — initial schema
-- Run in Supabase SQL Editor or via supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Supply Chain ───────────────────────────────────────────────

CREATE TABLE supply_chain_paths (
  id            TEXT PRIMARY KEY,
  name_key      TEXT NOT NULL,
  description_key TEXT NOT NULL,
  market        TEXT NOT NULL DEFAULT 'AU',
  path_type     TEXT NOT NULL CHECK (path_type IN ('primary', 'alternative', 'high_risk')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE path_nodes (
  id                  TEXT PRIMARY KEY,
  path_id             TEXT NOT NULL REFERENCES supply_chain_paths(id) ON DELETE CASCADE,
  sequence            INT NOT NULL,
  node_type           TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  region              TEXT,
  role_description    TEXT,
  risk_level          TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  status              TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'blocked')),
  notes               TEXT,
  entity_name         TEXT,
  document_completion INT NOT NULL DEFAULT 0 CHECK (document_completion BETWEEN 0 AND 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_path_nodes_path_id ON path_nodes(path_id);

CREATE TABLE path_edges (
  id                     TEXT PRIMARY KEY,
  path_id                TEXT NOT NULL REFERENCES supply_chain_paths(id) ON DELETE CASCADE,
  from_node_id           TEXT NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  to_node_id             TEXT NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  transport_mode         TEXT NOT NULL,
  estimated_days         INT NOT NULL,
  incoterms              TEXT,
  checkpoint_description TEXT,
  required_documents     JSONB NOT NULL DEFAULT '[]',
  risk_level             TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  status                 TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id              TEXT PRIMARY KEY,
  doc_type        TEXT NOT NULL,
  linked_node_id  TEXT REFERENCES path_nodes(id) ON DELETE SET NULL,
  linked_product  TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('valid', 'expiring_soon', 'expired', 'missing', 'pending')),
  expiry_date     DATE,
  gap_note        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Regulatory & Intelligence ────────────────────────────────

CREATE TABLE regulatory_entries (
  id              TEXT PRIMARY KEY,
  market          TEXT NOT NULL,
  region          TEXT NOT NULL,
  product         TEXT NOT NULL,
  regulatory_body TEXT NOT NULL,
  classification  TEXT NOT NULL,
  requirements    JSONB NOT NULL DEFAULT '[]',
  risk_level      TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  last_updated    DATE NOT NULL,
  source          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id                TEXT PRIMARY KEY,
  priority          TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2')),
  title_key         TEXT NOT NULL,
  summary_key       TEXT NOT NULL,
  source            TEXT NOT NULL CHECK (source IN ('agent', 'manual', 'scheduled_scout')),
  status            TEXT NOT NULL CHECK (status IN ('unread', 'read', 'in_progress', 'done', 'dismissed')),
  suggested_actions JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE entities (
  id                  TEXT PRIMARY KEY,
  type                TEXT NOT NULL CHECK (type IN ('supplier', 'customer', 'intermediary')),
  name                TEXT NOT NULL,
  country             TEXT NOT NULL,
  region              TEXT,
  contact             TEXT NOT NULL,
  email               TEXT NOT NULL,
  products            JSONB NOT NULL DEFAULT '[]',
  cooperation_status  TEXT NOT NULL,
  latest_quote        JSONB,
  risk_notes          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE risk_signals (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title_key       TEXT NOT NULL,
  body_key        TEXT NOT NULL,
  affected_nodes  JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL CHECK (status IN ('open', 'monitoring', 'resolved')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Agent Inbox ────────────────────────────────────────────────

CREATE TABLE agent_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author           TEXT NOT NULL,
  content          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'rejected')),
  proposed_changes JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at     TIMESTAMPTZ
);

CREATE INDEX idx_agent_submissions_status ON agent_submissions(status);

CREATE TABLE activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  payload     JSONB,
  actor       TEXT NOT NULL DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Regulatory scans (Hermes / MCP cron) ───────────────────────

CREATE TABLE regulatory_scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source       TEXT NOT NULL DEFAULT 'scheduled_scout',
  findings     JSONB NOT NULL DEFAULT '[]',
  alerts_created INT NOT NULL DEFAULT 0,
  scanned_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── updated_at trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_path_nodes_updated BEFORE UPDATE ON path_nodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_documents_updated BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_regulatory_updated BEFORE UPDATE ON regulatory_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_entities_updated BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: service role bypasses; anon read-only for demo
ALTER TABLE supply_chain_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON supply_chain_paths FOR SELECT USING (true);
CREATE POLICY "public_read" ON path_nodes FOR SELECT USING (true);
CREATE POLICY "public_read" ON path_edges FOR SELECT USING (true);
CREATE POLICY "public_read" ON documents FOR SELECT USING (true);
CREATE POLICY "public_read" ON regulatory_entries FOR SELECT USING (true);
CREATE POLICY "public_read" ON alerts FOR SELECT USING (true);
CREATE POLICY "public_read" ON entities FOR SELECT USING (true);
CREATE POLICY "public_read" ON risk_signals FOR SELECT USING (true);
CREATE POLICY "public_read" ON agent_submissions FOR SELECT USING (true);
