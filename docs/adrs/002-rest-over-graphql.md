# ADR-002: REST API over GraphQL

**Status**: Accepted  
**Date**: 2026-01-26  
**Deciders**: Engineering Team

---

## Context and Problem Statement

We need to design an API for frontend-backend communication.

**Should we use REST or GraphQL?**

---

## Decision Drivers

- Team familiarity
- Client complexity (Next.js SSR + CSR)
- Caching strategy
- Tooling maturity

---

## Considered Options

1. **REST API** - Traditional HTTP endpoints
2. **GraphQL** - Schema-driven queries
3. **tRPC** - TypeScript RPC
4. **gRPC** - High-performance RPC

---

## Decision Outcome

**Chosen option: REST API (Option 1)**

### Why REST?

✅ **Team knows it well** - No learning curve  
✅ **HTTP caching** - Works out of the box (Vercel Edge Cache)  
✅ **Tooling** - Swagger, Postman, curl  
✅ **Next.js integration** - Easy to use in Server Components  
✅ **Debugging** - Network tab shows everything clearly

### Why NOT GraphQL?

❌ **Overkill for our use case** - We don't have complex nested queries  
❌ **Caching complexity** - Requires Apollo Client or similar  
❌ **N+1 problem** - Easy to write inefficient queries  
❌ **Team inexperience** - Would slow down development

---

## Consequences

### Good
- Fast development velocity
- Easy to cache responses
- Standard HTTP status codes

### Bad
- Over-fetching data (getting more fields than needed)
- Under-fetching data (need multiple requests)

### Mitigation
- Design endpoints with specific use cases in mind
- Use query parameters for field selection if needed

---

## Validation

**Success Metrics:**
- API response time p95 < 200ms (simple reads)
- Developer satisfaction (no complaints about API complexity)

---

## Future Considerations

If we grow to 10+ frontend teams with diverse needs, reconsider GraphQL.

---

## References

- [REST API Design Best Practices](https://restfulapi.net/)
