#!/bin/bash
# Refresh Materialized Views for Reports Module
# Run this script hourly via cron or manually

echo "🔄 Refreshing materialized views..."

docker exec rental-room-db psql -U rental_user -d rental_room_db << 'EOF'
-- Refresh all materialized views concurrently
REFRESH MATERIALIZED VIEW CONCURRENTLY landlord_revenue_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY property_performance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_payment_behavior;
REFRESH MATERIALIZED VIEW CONCURRENTLY popular_searches_mv;

-- Log refresh time
SELECT 'Materialized views refreshed successfully at ' || NOW();
EOF

echo "✅ Refresh complete"
