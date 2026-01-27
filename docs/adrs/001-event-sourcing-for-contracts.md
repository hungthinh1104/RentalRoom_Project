# ADR-001: Event Sourcing for Contract Lifecycle

**Status**: Accepted  
**Date**: 2026-01-26  
**Deciders**: Engineering Team  
**Technical Story**: [Contract State Management](#)

---

## Context and Problem Statement

Contracts in the rental system undergo complex state transitions (DRAFT → PENDING → ACTIVE → TERMINATED) with strict business rules. We need:
- **Immutability**: Once signed, contracts cannot be modified without audit trail
- **Auditability**: Legal requirement to track all changes
- **Debugging**: Ability to replay events to investigate disputes

**How do we ensure data integrity and provide full audit trails for contract operations?**

---

## Decision Drivers

- Legal compliance (Vietnam rental law)
- Dispute resolution needs
- Data integrity for financial transactions
- Debugging production issues

---

## Considered Options

1. **Event Sourcing** - Store all events, derive state
2. **Audit Log Table** - Separate `contract_audit` table with triggers
3. **Versioned Rows** - Keep old contract versions in same table
4. **No Special Handling** - Just update rows directly

---

## Decision Outcome

**Chosen option: Event Sourcing (Option 1)**

We implement a **hybrid approach**:
- **Event Store** (`domain_events` table) for critical actions:
  - Contract signed
  - Payment received
  - Contract terminated
- **State Table** (`contracts` table) for current state (query performance)

### Why Event Sourcing?
- ✅ **Immutable audit trail**: Events are append-only
- ✅ **Replay capability**: Can reconstruct state at any point in time
- ✅ **Debugging**: Can trace exact sequence of actions
- ✅ **Compliance**: Meets legal audit requirements

### Why NOT Pure Event Sourcing?
- ❌ Query complexity: Reading current state requires event replay
- ❌ Performance: CQRS adds complexity we don't need yet

### Hybrid Approach
- Events are stored in `domain_events` table
- Current state is materialized in `contracts` table
- **Invariant**: Events are source of truth; state table can be rebuilt

---

## Consequences

### Good
- Full audit trail for legal compliance
- Easy to debug contract disputes
- Can add time-travel queries later

### Bad
- Event store must be kept in sync with state table (consistency risk)
- Slightly more complex write operations

### Mitigation
- Transaction-scoped writes (events + state updated together)
- Periodic reconciliation job to verify consistency
- Unit tests for event replay logic

---

## Validation

**Success Metrics:**
- Zero inconsistencies between events and state (monthly audit)
- All contract disputes resolved using event history
- Event replay can reconstruct any contract state

---

## Related Decisions

- [ADR-004](./004-prisma-orm-choice.md) - Prisma transactions ensure atomicity

---

## References

- [Event Sourcing by Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Journey by Microsoft](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
