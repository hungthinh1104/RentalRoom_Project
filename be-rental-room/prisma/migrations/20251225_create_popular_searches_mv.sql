-- CreateMaterializedView: popular_searches_mv
-- This view aggregates popular searches for admin market insights

CREATE MATERIALIZED VIEW IF NOT EXISTS popular_searches_mv AS
SELECT 
  query,
  search_count,
  last_searched
FROM popular_search
WHERE search_count > 0
ORDER BY search_count DESC, last_searched DESC
LIMIT 100;

-- Create index for faster refresh
CREATE INDEX IF NOT EXISTS idx_popular_searches_mv_count 
ON popular_searches_mv(search_count DESC);

-- Refresh function (call this periodically via cron or manually)
CREATE OR REPLACE FUNCTION refresh_popular_searches_mv()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_searches_mv;
END;
$$ LANGUAGE plpgsql;
