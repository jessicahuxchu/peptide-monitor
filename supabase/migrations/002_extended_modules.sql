-- Peptide Command — extended modules (product monitor, intelligence, finance, relations, dashboard)

-- ─── Product Monitor ────────────────────────────────────────────

CREATE TABLE monitor_meta (
  id                  TEXT PRIMARY KEY DEFAULT 'default',
  benchmark_date      DATE NOT NULL,
  platform_count      INT NOT NULL,
  product_type_count  INT NOT NULL,
  listing_count       INT NOT NULL,
  source_files        JSONB NOT NULL DEFAULT '[]',
  budget_split        JSONB NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE monitor_platforms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE product_monitor_records (
  id                  TEXT PRIMARY KEY,
  product             TEXT NOT NULL,
  display_name_zh     TEXT,
  primary_spec        TEXT NOT NULL,
  category            TEXT NOT NULL,
  tier                TEXT NOT NULL,
  tier_source         TEXT NOT NULL DEFAULT 'auto',
  platform_coverage   INT NOT NULL,
  platform_total      INT NOT NULL,
  platform_presence   JSONB NOT NULL DEFAULT '{}',
  platform_listings   JSONB NOT NULL DEFAULT '{}',
  common_blends       JSONB NOT NULL DEFAULT '[]',
  spec_profile        JSONB NOT NULL DEFAULT '{}',
  supply_metrics      JSONB NOT NULL DEFAULT '{}',
  au_regulatory_risk  TEXT NOT NULL,
  regulatory_notes    JSONB NOT NULL DEFAULT '[]',
  scores              JSONB NOT NULL DEFAULT '{}',
  composite_score     NUMERIC NOT NULL DEFAULT 0,
  stocking_logic      TEXT NOT NULL DEFAULT '',
  notes               TEXT,
  last_reviewed       DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_monitor_tier ON product_monitor_records(tier);
CREATE INDEX idx_product_monitor_product ON product_monitor_records(product);

CREATE TABLE product_blends (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  components          JSONB NOT NULL DEFAULT '[]',
  platform_coverage   INT NOT NULL,
  platform_total      INT NOT NULL,
  tier                TEXT NOT NULL,
  stock_mode          TEXT NOT NULL
);

-- ─── Intelligence ───────────────────────────────────────────────

CREATE TABLE intelligence_signals (
  id                  TEXT PRIMARY KEY,
  source              TEXT NOT NULL,
  title               TEXT NOT NULL,
  summary             TEXT NOT NULL,
  signal_date         DATE NOT NULL,
  region              TEXT,
  products            JSONB NOT NULL DEFAULT '[]',
  heat_impact         INT,
  regulatory_impact   INT,
  trend               TEXT CHECK (trend IN ('up', 'down', 'stable')),
  url                 TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sku_opportunities (
  id                      TEXT PRIMARY KEY,
  product                 TEXT NOT NULL,
  demand_score            INT NOT NULL,
  local_price             NUMERIC NOT NULL,
  competitive_price       NUMERIC NOT NULL,
  regulatory_sensitivity  NUMERIC NOT NULL,
  opportunity_score       INT NOT NULL,
  trend                   TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
  sparkline               JSONB NOT NULL DEFAULT '[]'
);

-- ─── Finance ────────────────────────────────────────────────────

CREATE TABLE sales_records (
  id          TEXT PRIMARY KEY,
  sale_date   TEXT NOT NULL,
  country     TEXT NOT NULL,
  region      TEXT NOT NULL,
  product     TEXT NOT NULL,
  category    TEXT NOT NULL,
  quantity    NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  revenue     NUMERIC NOT NULL,
  currency    TEXT NOT NULL
);

CREATE INDEX idx_sales_records_date ON sales_records(sale_date);
CREATE INDEX idx_sales_records_country ON sales_records(country);

-- ─── Relations (matching) ─────────────────────────────────────────

CREATE TABLE supplier_profiles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT NOT NULL,
  email       TEXT NOT NULL,
  products    JSONB NOT NULL DEFAULT '[]',
  price       NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  moq         TEXT NOT NULL,
  documents   JSONB NOT NULL DEFAULT '[]',
  country     TEXT NOT NULL,
  region      TEXT NOT NULL
);

CREATE TABLE customer_demands (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  contact               TEXT NOT NULL,
  email                 TEXT NOT NULL,
  product               TEXT NOT NULL,
  quantity              TEXT NOT NULL,
  target_price          NUMERIC NOT NULL,
  price_unit            TEXT NOT NULL,
  required_documents    JSONB NOT NULL DEFAULT '[]',
  country               TEXT NOT NULL,
  region                TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('active', 'negotiating', 'prospect'))
);

-- ─── Dashboard widgets (strategic home mock summaries) ────────────

CREATE TABLE platform_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Triggers ───────────────────────────────────────────────────

CREATE TRIGGER tr_monitor_meta_updated BEFORE UPDATE ON monitor_meta
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_product_monitor_updated BEFORE UPDATE ON product_monitor_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_platform_config_updated BEFORE UPDATE ON platform_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── RLS (read-only public demo) ────────────────────────────────

ALTER TABLE monitor_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_monitor_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_blends ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON monitor_meta FOR SELECT USING (true);
CREATE POLICY "public_read" ON monitor_platforms FOR SELECT USING (true);
CREATE POLICY "public_read" ON product_monitor_records FOR SELECT USING (true);
CREATE POLICY "public_read" ON product_blends FOR SELECT USING (true);
CREATE POLICY "public_read" ON intelligence_signals FOR SELECT USING (true);
CREATE POLICY "public_read" ON sku_opportunities FOR SELECT USING (true);
CREATE POLICY "public_read" ON sales_records FOR SELECT USING (true);
CREATE POLICY "public_read" ON supplier_profiles FOR SELECT USING (true);
CREATE POLICY "public_read" ON customer_demands FOR SELECT USING (true);
CREATE POLICY "public_read" ON platform_config FOR SELECT USING (true);

-- risk_signals RLS (from 001, ensure policy exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'risk_signals' AND policyname = 'public_read'
  ) THEN
    ALTER TABLE risk_signals ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "public_read" ON risk_signals FOR SELECT USING (true);
  END IF;
END $$;
