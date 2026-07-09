-- Locale-aware product intro (chemical composition + primary function)
ALTER TABLE product_monitor_records
  ADD COLUMN IF NOT EXISTS product_intro JSONB;
