-- M11: entry_fee/prize_money were mapped as Double end-to-end (entity + every
-- DTO), a floating-point precision-loss risk for currency values. Switching
-- the Java side to BigDecimal requires the column itself to be NUMERIC, not
-- floating point, or ddl-auto=validate will fail at startup.

ALTER TABLE event_sports ALTER COLUMN entry_fee TYPE NUMERIC(12,2) USING entry_fee::numeric(12,2);
ALTER TABLE event_sports ALTER COLUMN prize_money TYPE NUMERIC(12,2) USING prize_money::numeric(12,2);
