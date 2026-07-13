-- Allow SKU opportunity rows sourced from social heat without pricing intel.
ALTER TABLE sku_opportunities
  ALTER COLUMN local_price DROP NOT NULL,
  ALTER COLUMN competitive_price DROP NOT NULL;
