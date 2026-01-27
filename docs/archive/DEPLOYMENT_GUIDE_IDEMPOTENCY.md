# Deployment Guide: Idempotency & Concurrency Protection

## Pre-Deployment Checklist

### Code Review
- [x] Idempotency keys required on all critical endpoints
- [x] Pessimistic locking (FOR UPDATE) implemented for payment processing
- [x] Optimistic locking (updateMany with state check) for contract approval
- [x] Rate limiting middleware configured and registered
- [x] TTL cleanup cron job configured
- [x] Frontend API client updated
- [x] Frontend utility functions available
- [x] Logging added for audit trails
- [x] Tests passing for core functionality

### Database Preparation

#### Step 1: Backup Current Database
```bash
# Production backup
pg_dump -h <prod-host> -U <user> -d rental_room > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Create New Tables (if not already created)

Run the Prisma migration:
```bash
cd rentalroom-be
npx prisma migrate deploy
```

**Table Details**:
- `idempotent_operations`: Stores deduplication keys and responses for billing operations
  - TTL: 24 hours
  - Index: `idempotencyKey` (unique), `expiresAt`

- `idempotency_record`: Stores deduplication for contract operations
  - TTL: 24 hours
  - Index: `idempotencyKey` (unique), `expiresAt`

#### Step 3: Verify Tables Created
```sql
-- Check table creation
SELECT * FROM information_schema.tables 
WHERE table_name IN ('idempotent_operations', 'idempotency_record');

-- Verify indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('idempotent_operations', 'idempotency_record');
```

## Deployment Steps

### 1. Backend Deployment

#### Build & Test
```bash
cd rentalroom-be

# Install dependencies
npm ci

# Run tests (should pass)
npm test

# Build
npm run build
```

#### Deploy
```bash
# Using PM2 (if applicable)
pm2 deploy ecosystem.config.json production update
pm2 restart app-name

# Or manual deployment
npm run build
pm2 restart rental-room-api
```

### 2. Middleware Registration Verification

Verify that `RateLimitMiddleware` is registered in `main.ts`:

```typescript
// main.ts should include:
app.use(new RateLimitMiddleware());
```

Check logs:
```bash
# Should see middleware initialization
grep "rate-limit\|idempotency" logs/application.log
```

### 3. Cron Job Verification

Verify daily cleanup cron job:
```bash
# Check PM2 logs
pm2 logs app-name | grep "cleanup\|TTL"

# Should see daily messages at 2am UTC
```

### 4. Frontend Deployment

#### Build
```bash
cd rentalroom-fe

# Install dependencies
npm ci

# Build
npm run build
```

#### Deploy
```bash
# If using Vercel
vercel deploy --prod

# If using self-hosted
npm run build
cp -r .next /deployment/path/
pm2 restart next-app
```

### 5. Client Library Update

Verify frontend is using new idempotency utilities:

**Example: Contract Approval**
```typescript
// Before (no idempotency)
await api.patch(`/applications/${appId}/approve`);

// After (with idempotency)
const idempotencyKey = generateContractIdempotencyKey(appId, 'APPROVE');
await api.patch(`/applications/${appId}/approve`, data, { idempotencyKey });
```

## Post-Deployment Verification

### 1. Smoke Tests

#### Test Idempotency
```bash
# Mark invoice as paid multiple times with same key
curl -X PATCH http://localhost:3000/invoices/123/mark-paid \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "bank_transfer"}'

# Repeat same request - should return identical response
curl -X PATCH http://localhost:3000/invoices/123/mark-paid \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "bank_transfer"}'
```

#### Test Rate Limiting
```bash
# Send 11 requests quickly to sensitive endpoint
for i in {1..11}; do
  curl -X POST http://localhost:3000/meter-readings \
    -H "Idempotency-Key: rate-test-$i" \
    -H "Content-Type: application/json" \
    -d '{"contractId": "123", "reading": 100}'
done

# Should see 429 Too Many Requests on 11th request
```

#### Test Missing Idempotency Key
```bash
# Should reject without Idempotency-Key header
curl -X PATCH http://localhost:3000/invoices/123/mark-paid \
  -H "Content-Type: application/json"

# Should return 400 Bad Request
```

### 2. Database Health Checks

```sql
-- Check idempotent_operations table
SELECT COUNT(*) as total_operations, 
       COUNT(*) FILTER (WHERE expiresAt > NOW()) as valid_operations
FROM idempotent_operations;

-- Check for stale records (should be cleaned up daily)
SELECT COUNT(*) FROM idempotent_operations 
WHERE expiresAt < NOW();

-- Verify index performance
EXPLAIN ANALYZE
SELECT * FROM idempotent_operations 
WHERE idempotencyKey = 'test-key-123';
```

### 3. Log Monitoring

Watch for:
```bash
# Idempotent operations logged
tail -f logs/application.log | grep "IDEMPOTENT"

# Rate limit hits
tail -f logs/application.log | grep "429\|rate-limit"

# TTL cleanup
tail -f logs/application.log | grep "cleanup"
```

### 4. Frontend Testing

Manual test in browser:
1. Go to invoice payment page
2. Click "Pay Invoice" button
3. Verify `Idempotency-Key` header sent in Network tab
4. Refresh page or rapidly click button again
5. Should see same result (cached response)

## Rollback Plan

If issues occur:

### 1. Remove Idempotency Requirement (Temporary)

**Edit**: `billing.controller.ts`
```typescript
// Comment out idempotency-key requirement temporarily
@Headers('idempotency-key')
idempotencyKey?: string  // Change from required parameter
```

### 2. Disable Rate Limiting

**Edit**: `main.ts`
```typescript
// Comment out middleware
// app.use(new RateLimitMiddleware());
```

### 3. Disable TTL Cleanup

**Edit**: `legal-integrity.cron.ts`
```typescript
@Cron('0 2 * * *')
async cleanupExpiredOperations() {
  // TODO: Disabled during incident
  return;
}
```

### 4. Full Rollback

```bash
# Stop app
pm2 stop rental-room-api

# Revert to previous version
git revert <commit-hash>
npm ci
npm run build

# Drop new tables if needed
psql -h <host> -U <user> -d rental_room -c "DROP TABLE idempotent_operations, idempotency_record CASCADE;"

# Restart
pm2 restart rental-room-api
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Idempotency Hit Rate**
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as total_operations,
  COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as cached_results
FROM idempotent_operations
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

2. **Rate Limit Violations**
```
# Watch for 429 responses
curl http://localhost:9090/metrics | grep http_requests_total
```

3. **Lock Contention**
```sql
SELECT * FROM pg_stat_activity 
WHERE state LIKE '%lock%' OR wait_event LIKE 'lock%';
```

### Alert Conditions

- [ ] Alert if idempotency_operations table grows >1M rows (cleanup failing)
- [ ] Alert if rate limit violations >100/min (suspicious activity)
- [ ] Alert if lock wait time >5 seconds (deadlock risk)
- [ ] Alert if missing Idempotency-Key errors >1% of requests

## Support & Troubleshooting

### Common Issues

**Issue**: "Idempotency-Key header required"
- **Cause**: Frontend not using new API client with idempotency support
- **Solution**: Verify frontend deployed with new client.ts version

**Issue**: 429 Too Many Requests
- **Cause**: Client hitting rate limit
- **Solution**: Increase `sensitiveLimit` in rate-limit.middleware.ts or implement request queuing on client

**Issue**: Stale idempotency records not cleaned up
- **Cause**: Cron job not running
- **Solution**: Verify PM2 logs, restart app, manually run cleanup:
```sql
DELETE FROM idempotent_operations WHERE expiresAt < NOW();
DELETE FROM idempotency_record WHERE expiresAt < NOW();
```

**Issue**: Duplicate payments still occurring
- **Cause**: Transaction not fully atomic, Prisma.sql not executing
- **Solution**: Check Prisma logs, verify transaction middleware active, review database transaction isolation level

### Getting Help

1. Check logs: `pm2 logs rental-room-api`
2. Verify tables exist: `psql ... -c "\\dt idempotent_operations"`
3. Test endpoint directly: Use curl commands above
4. Review implementation: Check [DATABASE_SAFETY_IMPLEMENTATION.md](./DATABASE_SAFETY_IMPLEMENTATION.md)

## Success Criteria

✅ Deployment successful when:

1. All endpoints requiring Idempotency-Key reject requests without header
2. Duplicate requests with same key return identical responses
3. Rate limiting enforced (429 after threshold)
4. Idempotency records created in database
5. Cleanup cron job runs daily without errors
6. Frontend sending Idempotency-Key headers in requests
7. No database lock timeouts in logs
8. No duplicate payment audit log entries

## Post-Deployment Monitoring (First 24 Hours)

```bash
# Monitor error rate
pm2 logs rental-room-api | grep ERROR

# Monitor slow queries
tail -f /var/log/postgresql/postgresql.log | grep "duration:"

# Monitor idempotency table growth
watch 'psql -h <host> -U <user> -d rental_room -c "SELECT COUNT(*) FROM idempotent_operations;"'

# Monitor cron job execution
pm2 logs rental-room-api | grep cleanup
```

Once stable for 24 hours, monitoring can be reduced to standard operational levels.
