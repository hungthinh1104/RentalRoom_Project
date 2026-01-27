# Idempotency & Concurrency Protection Summary

## Executive Summary

The Rental Room platform now has **4-layer protection** against race conditions, duplicate processing, and financial inconsistencies:

| Layer | Mechanism | Protected Operations | Implementation |
|-------|-----------|---------------------|-----------------|
| 1 | **Pessimistic Locking** | Payment processing | `Prisma.sql FOR UPDATE` |
| 2 | **Optimistic Locking** | Contract operations | `updateMany(status=PENDING)` |
| 3 | **Idempotency Keys** | All critical endpoints | Deduplication table + header |
| 4 | **Rate Limiting** | API abuse prevention | Per-IP request tracking |

---

## Layer 1: Pessimistic Locking (Strongest)

### What It Prevents
- **Double Payment**: Two requests trying to mark same invoice as paid simultaneously
- **Lost Updates**: Concurrent modifications overwriting each other
- **Dirty Reads**: Reading partially-updated invoice state

### How It Works
```typescript
// 1. Acquire exclusive lock on invoice row
const invoice = await prisma.$queryRaw`
  SELECT * FROM "Invoice" 
  WHERE id = ${invoiceId} 
  FOR UPDATE  -- <- Only one request can hold this lock
`;

// 2. Check status while holding lock
if (invoice.status === 'PAID') {
  throw new Error('Already paid');
}

// 3. Update within transaction (lock held entire time)
await prisma.invoice.update({
  where: { id: invoiceId },
  data: { status: 'PAID', paidAt: new Date() }
});
// Lock released when transaction commits
```

### Scenario: Race Condition Example
```
Timeline:
[T0] Request A reads invoice status=UNPAID, acquires lock
[T1] Request B tries to read invoice, WAITS for lock (blocked)
[T2] Request A updates status=PAID, releases lock
[T3] Request B acquires lock, re-reads status=PAID
[T4] Request B throws error (already paid)

Result: Only one payment processed ✓
```

### Protected Operations
- ✅ `markAsPaid()` - billing.service.ts

---

## Layer 2: Optimistic Locking (Default)

### What It Prevents
- **Double Approval**: Two requests approving same contract
- **Conflicting Updates**: Status changes that conflict
- **State Validation Failures**: Operations on wrong state

### How It Works
```typescript
// Update ONLY if status matches expected state
const result = await prisma.contractApplication.updateMany({
  where: {
    id: appId,
    status: 'PENDING'  // <-- State condition (optimistic lock)
  },
  data: {
    status: 'APPROVED',
    approvedAt: new Date()
  }
});

// If count=0, means status is NOT PENDING anymore
if (result.count === 0) {
  throw new BadRequestException('Application not in PENDING state');
}
```

### Scenario: Race Condition Example
```
Timeline:
[T0] Request A: updateMany(WHERE id=X, status=PENDING) → Updates 1 ✓
     → Status changes to APPROVED
[T1] Request B: updateMany(WHERE id=X, status=PENDING) → Updates 0
     → No matching record (status already APPROVED)
     → Throws BadRequestException

Result: Only one approval processed ✓
```

### Protected Operations
- ✅ `approveApplication()` - contract-application.service.ts
- ✅ `rejectApplication()` - contract-application.service.ts

---

## Layer 3: Idempotency Keys (Network Resilience)

### What It Prevents
- **Duplicate Processing**: Retried requests processing multiple times
- **Network Timeout Errors**: Client retries causing double-work
- **Lost Updates from Retries**: Inconsistent state from multiple attempts

### How It Works

#### 1. Controller Requires Header
```typescript
@Patch('/invoices/:id/mark-paid')
@Headers('idempotency-key')  // <- REQUIRED
async markAsPaid(
  @Param('id') id: string,
  @Headers('idempotency-key') idempotencyKey: string  // <- REQUIRED
) {
  return this.billingService.markAsPaid(id, idempotencyKey);
}
```

#### 2. Service Checks Deduplication Table
```typescript
// First check if we already processed this
const existing = await prisma.idempotent_operations.findFirst({
  where: { idempotencyKey }
});

if (existing) {
  // Already processed, return cached result
  return existing.response;  // <-- Same result, no re-processing
}

// Process new request...
const result = await performPayment(...);

// Store for future deduplication
await prisma.idempotent_operations.create({
  data: {
    idempotencyKey,
    response: result,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24h TTL
  }
});

return result;
```

#### 3. Cleanup Removes Old Records
```typescript
// Daily cleanup of 24-hour-old records
@Cron('0 2 * * *')  // 2am UTC daily
async cleanupExpiredOperations() {
  const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Remove old idempotency records
  await prisma.idempotent_operations.deleteMany({
    where: { createdAt: { lt: expiryDate } }
  });
}
```

### Scenario: Duplicate Request Example
```
Timeline:
[T0] Client sends: PATCH /invoices/123/mark-paid
     Header: Idempotency-Key: abc123def456
     Service: Not found in DB, processes payment, stores in DB

[T1] Network timeout, client automatically retries
     Sends: PATCH /invoices/123/mark-paid
     Header: Idempotency-Key: abc123def456  (same key!)

[T2] Service: Finds existing record for abc123def456
     Returns cached response WITHOUT re-processing payment

Result: Single payment, two client attempts ✓
```

### Protected Operations
- ✅ `markAsPaid()` - billing.service.ts
- ✅ `submitMeterReadingsForLandlord()` - billing.service.ts
- ✅ `approveApplication()` - contract-application.service.ts
- ✅ `rejectApplication()` - contract-application.service.ts

---

## Layer 4: Rate Limiting (Abuse Prevention)

### What It Prevents
- **Brute Force Attacks**: Thousands of requests per minute
- **DoS Attacks**: Overwhelming the server
- **Accidental Abuse**: Buggy clients sending requests rapidly

### How It Works
```typescript
// Per-IP request tracking
const ipAddress = request.ip;
const now = Date.now();
const windowStart = now - 15 * 60 * 1000;  // 15 minutes

// Check if request count exceeds limit
const requestCount = this.requestStore[ipAddress]?.filter(
  (time) => time > windowStart
).length || 0;

if (isSensitiveEndpoint(request.path)) {
  // Sensitive operations: 10 per minute
  if (requestCount >= 10) {
    return response.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    });
  }
} else {
  // General endpoints: 100 per 15 minutes
  if (requestCount >= 100) {
    return response.status(429).json({ error: 'Rate limit exceeded' });
  }
}
```

### Limits
```
General Endpoints:        100 requests per 15 minutes
Sensitive Endpoints:      10 requests per minute

Sensitive Endpoints:
- /invoices/*/mark-paid
- /meter-readings
- /applications/*/approve
- /applications/*/reject
```

### Scenario: Rate Limit Example
```
Timeline:
[T0-T10] Attacker sends 10 requests to /applications/X/approve
[T11] Service processes requests 1-10 ✓
[T12] Attacker sends 11th request
     Response: 429 Too Many Requests
[T13] Attacker sends 12th request
     Response: 429 Too Many Requests
[T60] Rate limit window resets, new requests allowed

Result: DoS attack mitigated ✓
```

---

## Frontend Integration

### Before (No Idempotency)
```typescript
// No idempotency key, vulnerable to duplicates
async function approveLandlord(appId) {
  const response = await fetch(`/applications/${appId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}

// If network timeout, developer has to retry manually
// Risk: Double approval if clicked twice
```

### After (With Idempotency)
```typescript
// Step 1: Generate unique key for this operation
const idempotencyKey = generateContractIdempotencyKey(appId, 'APPROVE');

// Step 2: Send request with key in header
const response = await api.patch(`/applications/${appId}/approve`, 
  { decision: 'approved' },
  { idempotencyKey }  // <-- Key included
);

// Step 3: Client library auto-retries if network fails
// Server deduplicates using the key
// Result: Safe to retry any number of times

function handleClick() {
  approveLandlord(appId)
    .catch(error => {
      // Network error? Retry safely - key ensures deduplication
      return approveLandlord(appId);  // <-- Safe retry!
    });
}
```

### Utility Functions Available
```typescript
// Generic idempotency key
generateIdempotencyKey()
  // => "550e8400-e29b-41d4-a716-446655440000"

// Domain-specific keys (recommended)
generateContractIdempotencyKey(appId, 'APPROVE')
  // => "contract:app-123:APPROVE:550e8400..."

generateInvoiceIdempotencyKey(invoiceId, 'MARK_PAID')
  // => "invoice:inv-456:MARK_PAID:550e8400..."

generateMeterReadingIdempotencyKey(contractId, '2024-01')
  // => "meter:contract-789:2024-01:550e8400..."
```

---

## Database Tables

### `idempotent_operations`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | String | Primary key |
| `idempotencyKey` | String | Unique request identifier |
| `response` | JSON | Cached response to return |
| `createdAt` | DateTime | Creation timestamp |
| `expiresAt` | DateTime | Auto-cleanup time (24h) |

**Indexes**: 
- `idempotencyKey` (UNIQUE)
- `expiresAt` (for cleanup query)

### `idempotency_record` (Contracts)
| Column | Type | Purpose |
|--------|------|---------|
| `id` | String | Primary key |
| `idempotencyKey` | String | Unique request identifier |
| `entityType` | String | "CONTRACT_APPLICATION" |
| `entityId` | String | Application ID |
| `actionType` | String | "APPROVE" or "REJECT" |
| `response` | JSON | Cached response |
| `createdAt` | DateTime | Creation timestamp |
| `expiresAt` | DateTime | Auto-cleanup time (24h) |

---

## Testing Verification

### ✅ Tests Passing
- Pessimistic lock mechanism (snapshot integrity)
- Optimistic lock mechanism (contract approval)
- Idempotency key deduplication
- Rate limiting enforcement
- Hash chain verification
- Concurrent request handling

### Run Tests
```bash
cd rentalroom-be

# All tests
npm test

# Concurrency tests only
npm test -- src/concurrency.spec.ts

# Snapshot tests
npm test -- src/modules/snapshots/snapshot.service.spec.ts

# Billing tests
npm test -- src/modules/billing/billing.service.spec.ts
```

---

## Monitoring & Alerting

### Key Metrics
```sql
-- Idempotency hit rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE response IS NOT NULL) as cached
FROM idempotent_operations
WHERE createdAt > NOW() - INTERVAL '1 hour';

-- Rate limit hits
SELECT COUNT(*) FROM nginx_logs 
WHERE status = 429 
AND timestamp > NOW() - INTERVAL '1 hour';

-- Lock wait times
SELECT * FROM pg_stat_database 
WHERE blks_hit > 0 AND conflicts > 0;
```

### Alert Conditions
- ⚠️ Idempotency table >1M rows (cleanup failure)
- ⚠️ Rate limit violations >100/min (suspicious)
- ⚠️ Lock wait time >5s (deadlock risk)
- ⚠️ Missing Idempotency-Key errors >1% (frontend bug)

---

## Security Considerations

### ✅ Strengths
1. **Pessimistic locks** prevent concurrent payment duplicates
2. **Optimistic locks** prevent state machine violations
3. **Idempotency keys** prevent network-timeout duplicates
4. **Rate limiting** prevents abuse and DoS
5. **24h TTL** prevents indefinite storage
6. **Audit logging** enables compliance and debugging

### ⚠️ Trade-offs
1. **Lock contention**: High concurrency may see lock waits (mitigated by index on status)
2. **Storage overhead**: Idempotency table grows 24h worth of records
3. **Complexity**: More moving parts to monitor
4. **Client coordination**: Clients must use same idempotency key for retries

---

## Deployment Steps Summary

1. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify tables created**
   ```sql
   SELECT * FROM idempotent_operations LIMIT 1;
   ```

3. **Update frontend** with new API client

4. **Register middleware** (already done in main.ts)

5. **Verify rate limiting** 
   ```bash
   # Should see 429 after 11 requests to sensitive endpoint
   ```

6. **Check cron job** logs daily for cleanup execution

---

## Rollback Plan

If critical issue found:

```bash
# 1. Disable idempotency requirement
# Edit: billing.controller.ts, remove @Headers('idempotency-key')

# 2. Disable rate limiting
# Edit: main.ts, comment out: app.use(new RateLimitMiddleware());

# 3. If needed, drop tables
psql ... -c "DROP TABLE idempotent_operations, idempotency_record CASCADE;"

# 4. Redeploy previous version
git revert HEAD
npm run build
pm2 restart rental-room-api
```

---

## Next Steps (Phase 2)

- [ ] Distributed caching (Redis) for multi-instance setups
- [ ] Full blockchain-style snapshot chain for all operations
- [ ] Two-phase commit for cross-service transactions
- [ ] Automatic retry with exponential backoff
- [ ] Observability dashboards (Prometheus/Grafana)

---

## Files Modified

### Backend
- `src/modules/billing/billing.service.ts` - Pessimistic locking
- `src/modules/billing/billing.controller.ts` - Idempotency-Key header
- `src/modules/contracts/applications/contract-application.service.ts` - Optimistic locking
- `src/middleware/rate-limit.middleware.ts` - NEW
- `src/tasks/legal-integrity.cron.ts` - Cleanup job
- `src/concurrency.spec.ts` - Concurrency tests
- `src/modules/snapshots/snapshot.service.spec.ts` - Hash integrity tests
- `prisma/schema.prisma` - New tables

### Frontend
- `src/lib/api/client.ts` - Idempotency-Key header support
- `src/lib/idempotency.ts` - NEW utility functions

### Documentation
- `docs/DATABASE_SAFETY_IMPLEMENTATION.md` - Technical details
- `DEPLOYMENT_GUIDE_IDEMPOTENCY.md` - Deployment steps

---

## Support

For issues or questions:
1. Check logs: `pm2 logs rental-room-api`
2. Review: [DATABASE_SAFETY_IMPLEMENTATION.md](./rentalroom-be/docs/DATABASE_SAFETY_IMPLEMENTATION.md)
3. Test directly: Use curl commands in deployment guide
4. Monitor: Check idempotency table for record creation
