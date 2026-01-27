# ADR-003: Redis for Rate Limiting

**Status**: Accepted  
**Date**: 2026-01-26  
**Deciders**: Engineering Team

---

## Context and Problem Statement

We need to protect API endpoints from abuse (brute force login, spam).

**Where should we store rate-limiting state?**

---

## Decision Drivers

- Performance (low latency)
- Scalability (horizontal scaling)
- Share state across multiple backend instances

---

## Considered Options

1. **Redis** - In-memory key-value store
2. **In-Memory Map** - Node.js `Map()` in each instance
3. **PostgreSQL** - Store in main database
4. **DynamoDB** - AWS managed NoSQL

---

## Decision Outcome

**Chosen option: Redis (Option 1)**

### Why Redis?

✅ **Atomic operations** - `INCR` is thread-safe  
✅ **TTL support** - Keys expire automatically (sliding window)  
✅ **Shared state** - Multiple backend instances see same counters  
✅ **Low latency** - Sub-millisecond reads/writes  
✅ **Already in stack** - We use Redis for caching

### Why NOT In-Memory Map?

❌ Each backend instance has separate state (inconsistent limits)  
❌ State lost on restart

### Why NOT PostgreSQL?

❌ Too slow for rate limiting (adds DB query latency)  
❌ High write volume (wears out SSD)

---

## Consequences

### Good
- Consistent rate limits across all servers
- Fast response times
- Easy to adjust limits (just change Redis key TTL)

### Bad
- Redis becomes a critical dependency (SPOF)
- Need to monitor Redis memory usage

### Mitigation
- Deploy Redis in Sentinel/Cluster mode (Month 4 roadmap)
- Set max memory limits with `maxmemory-policy allkeys-lru`

---

## Implementation Details

**Rate Limit Key Format:**
```
rate_limit:{endpoint}:{userId}:{window}
```

**Example:**
```redis
SET rate_limit:/auth/login:user123:20260126-14 1 EX 60
INCR rate_limit:/auth/login:user123:20260126-14
```

---

## Validation

**Success Metrics:**
- Rate limit checks < 5ms (p95)
- Zero false-positives (legitimate users not blocked)

---

## Related Decisions

- [Roadmap: Redis Cluster (Month 4)](../scaling_roadmap.md#month-3-4-performance--scalability)

---

## References

- [Redis Rate Limiting Pattern](https://redis.io/topics/patterns/rate-limiting)
