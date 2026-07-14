-- Remove early mock/seed notification rows (a1–a4).
-- Alerts should only come from real events or manual create.
DELETE FROM alerts WHERE id IN ('a1', 'a2', 'a3', 'a4');
