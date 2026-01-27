-- Materialized view for landlord room revenue breakdown
-- Replaces JSON breakdown in LandlordRevenueSnapshot

CREATE MATERIALIZED VIEW IF NOT EXISTS landlord_room_breakdown AS
SELECT
  c.landlord_id,
  EXTRACT(YEAR FROM i.issue_date)::int AS year,
  EXTRACT(MONTH FROM i.issue_date)::int AS month,
  r.id AS room_id,
  r.room_number,
  SUM(i.total_amount)::numeric(16,2) AS total_revenue,
  COUNT(i.id)::int AS invoice_count
FROM invoice i
JOIN contract c ON i.contract_id = c.id
JOIN room r ON c.room_id = r.id
WHERE i.deleted_at IS NULL
GROUP BY c.landlord_id, year, month, r.id, r.room_number;

CREATE INDEX IF NOT EXISTS idx_landlord_room_breakdown_landlord_year
  ON landlord_room_breakdown(landlord_id, year);

CREATE INDEX IF NOT EXISTS idx_landlord_room_breakdown_landlord_month
  ON landlord_room_breakdown(landlord_id, year, month);
