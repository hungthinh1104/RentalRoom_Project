# Contract Termination Semantics Decision

**Date**: 2026-01-23  
**Decision Owner**: System Architect  
**Status**: FINALIZED

---

## Problem Statement

The QA Audit Report identified a critical RBAC conflict:

> **UC_COT_03 (Termination)**:  
> Both LANDLORD and TENANT can terminate contracts, but the "30-day notice" logic is ambiguous.  
> Who gives notice? What are the penalties? What are the legal implications?

This document resolves the conflict by defining **TWO distinct termination flows** with explicit legal semantics.

---

## Decision: Split Into Two Flows

We adopt a **dual-flow model** based on initiator and legal grounds:

1. **Tenant Early Move-Out** (Voluntary termination by tenant)
2. **Landlord Eviction** (Forced termination by landlord)

---

## Flow 1: Tenant Early Move-Out

### Legal Context
Tenant wishes to terminate contract BEFORE the end date due to personal reasons (job relocation, family emergency, etc.).

### Business Rules

| Rule | Value |
|------|-------|
| **Initiator** | TENANT (contract party) |
| **Notice Period** | 30 days minimum |
| **Penalty** | 1 month's rent (forfeit from deposit) |
| **Refund Calculation** | `deposit - penalty - damages - unpaid_invoices` |
| **Landlord Approval** | NOT required (tenant has right to leave with penalty) |
| **Room Status After** | `PENDING_HANDOVER` (until landlord confirms no damage) |

### Command Signature

```typescript
terminateContract(
  contractId: string,
  initiator: 'TENANT',
  terminationDate: Date,     // Must be ≥ 30 days from now
  reason: string,
  userId: string              // Must be tenant
): Promise<{
  contract: Contract,
  refundAmount: number,
  penalty: number,
  handoverDate: Date
}>
```

### Preconditions
- `Contract.status = ACTIVE`
- `userId = Contract.tenantId`
- `terminationDate ≥ now() + 30 days`
- No existing termination initiated

### Postconditions
- `Contract.status = TERMINATED`
- `Contract.terminationType = EARLY_BY_TENANT`
- `Contract.terminationReason` = reason
- `Contract.noticeDays` = days between now and terminationDate
- `Contract.earlyTerminationPenalty` = 1 month rent
- `Contract.refundAmount` = calculated refund
- `Room.status = PENDING_HANDOVER`
- Event: `CONTRACT_TERMINATED` (with termination type)

### Financial Calculation

```typescript
penalty = monthlyRent * 1.0;  // 1 month penalty
damages = handoverChecklist.deductions.total;
unpaidInvoices = Invoice.where(status != PAID).sum(totalAmount);
refund = deposit - penalty - damages - unpaidInvoices;

// Refund can be negative (tenant owes landlord)
// Refund can be positive (landlord owes tenant)
```

### Example Timeline

```
Day 0: Tenant submits termination (30 days notice)
Day 1-29: Notice period (contract still ACTIVE)
Day 30: Contract status → TERMINATED, Room → PENDING_HANDOVER
Day 30-37: Handover inspection period (7 days max)
Day 37: Landlord confirms handover, Room → AVAILABLE
Day 38: Refund processed
```

---

## Flow 2: Landlord Eviction

### Legal Context
Landlord forces termination due to tenant violations (non-payment, property damage, illegal activities, etc.).

### Business Rules

| Rule | Value |
|------|-------|
| **Initiator** | LANDLORD (contract party) or ADMIN |
| **Notice Period** | 60 days minimum (stricter to protect tenant rights) |
| **Penalty** | ZERO if tenant complies; FULL deposit if tenant refuses to leave |
| **Valid Grounds** | Non-payment (3+ months overdue), Property damage, Lease violations, Illegal activities |
| **Tenant Objection** | Tenant can dispute via `DisputeService` within 14 days |
| **Room Status After** | `PENDING_HANDOVER` or `UNAVAILABLE` (if police eviction) |

### Command Signature

```typescript
evictTenant(
  contractId: string,
  initiator: 'LANDLORD' | 'ADMIN',
  evictionDate: Date,         // Must be ≥ 60 days from now
  evictionGround: EvictionGround,
  evidence: string[],         // URLs to evidence (e.g., photos, email threads)
  userId: string              // Must be landlord or admin
): Promise<{
  contract: Contract,
  disputeDeadline: Date,
  refundAmount: number
}>
```

### Eviction Grounds (Enum)

```typescript
enum EvictionGround {
  NON_PAYMENT = 'NON_PAYMENT',           // 3+ months overdue
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',   // Documented damage beyond wear-and-tear
  LEASE_VIOLATION = 'LEASE_VIOLATION',   // Unauthorized sublease, pets, etc.
  ILLEGAL_ACTIVITY = 'ILLEGAL_ACTIVITY', // Police report required
  LANDLORD_NEEDS_PROPERTY = 'LANDLORD_NEEDS_PROPERTY' // Personal use (1 year notice)
}
```

### Preconditions
- `Contract.status = ACTIVE`
- `userId = Contract.landlordId` (or ADMIN)
- `evictionDate ≥ now() + 60 days` (or +365 days for LANDLORD_NEEDS_PROPERTY)
- Valid eviction ground with evidence
- No existing termination initiated

### Postconditions
- `Contract.status = TERMINATED`
- `Contract.terminationType = EARLY_BY_LANDLORD`
- `Contract.terminationReason` = evictionGround + evidence
- `Contract.noticeDays` = days between now and evictionDate
- `Contract.earlyTerminationPenalty` = 0 (unless tenant refuses)
- `Contract.refundAmount` = deposit - damages - unpaidInvoices (NO penalty)
- `Room.status = PENDING_HANDOVER` or `UNAVAILABLE`
- Event: `CONTRACT_TERMINATED` (with eviction ground)
- Dispute window opened (14 days)

### Financial Calculation

```typescript
// Landlord eviction: NO penalty if valid grounds
penalty = 0;
damages = handoverChecklist.deductions.total;
unpaidInvoices = Invoice.where(status != PAID).sum(totalAmount);
refund = deposit - damages - unpaidInvoices;

// If tenant refuses to leave after eviction date:
if (tenant_refuses) {
  penalty = deposit;  // Forfeit entire deposit
  refund = 0;
}
```

### Example Timeline

```
Day 0: Landlord initiates eviction (60 days notice)
Day 0-14: Tenant can file dispute
Day 1-59: Notice period (contract still ACTIVE, tenant can pay arrears to cancel)
Day 60: Contract status → TERMINATED, Room → PENDING_HANDOVER
Day 60-67: Forced handover period (7 days max)
Day 67: If tenant refuses, escalate to police eviction
Day 68: Refund processed (or $0 if refused)
```

---

## Flow 3: Mutual Agreement (Future Extension)

**Status**: Not yet implemented, but ALLOWED in design.

### Use Case
Both parties agree to terminate early without penalty.

### Business Rules
- Both landlord AND tenant sign termination agreement
- No penalty
- Flexible notice period (minimum 7 days)
- Refund = full deposit - damages - unpaid invoices

---

## Edge Cases \u0026 Clarifications

### Q1: What if tenant gives 29 days notice?
**A**: Command rejects with error: `"Minimum notice period is 30 days"`

### Q2: What if landlord evicts with only 30 days notice?
**A**: Command rejects with error: `"Minimum notice period for eviction is 60 days"`

### Q3: Can tenant dispute eviction?
**A**: YES. Tenant has 14 days to file dispute via `DisputeService`. Dispute does NOT block eviction but MAY result in compensation if landlord grounds are invalid.

### Q4: What if tenant pays arrears during eviction notice period?
**A**: Landlord can choose to CANCEL eviction. This requires a separate `cancelEviction()` command (not yet implemented).

### Q5: What if contract end date is < 30 days away and tenant wants to leave early?
**A**: Tenant can wait for natural expiration (no penalty) OR pay penalty for early termination. Command allows both.

### Q6: Who decides refund amount?
**A**:
- System automatically calculates based on formula
- Landlord confirms handover checklist (damages)
- If tenant disputes deductions → `DisputeService`

---

## Database Schema Impact

### Contract Table (No changes needed)
Existing fields are sufficient:
```typescript
terminationType: TerminationType?      // EARLY_BY_TENANT | EARLY_BY_LANDLORD | MUTUAL_AGREEMENT | EXPIRY
terminationReason: string?
terminatedByUserId: string?
earlyTerminationPenalty: Decimal?
refundAmount: Decimal?
noticeDays: int?
terminationApproved: boolean?
```

### Event Store
New event types:
- `CONTRACT_TERMINATED` (existing, now includes terminationType in payload)
- `EVICTION_INITIATED` (for audit trail)
- `EVICTION_DISPUTED` (links to Dispute)

---

## Implementation Checklist

- [x] Decision documented
- [ ] Update `ContractLifecycleService.terminate()` to split logic based on initiator
- [ ] Create `ContractLifecycleService.evict()` method
- [ ] Update RBAC to distinguish TERMINATE vs EVICT permissions
- [ ] Add eviction validation (grounds, evidence, notice period)
- [ ] Integrate with DisputeService for eviction disputes
- [ ] Update frontend to show different UI for tenant vs landlord termination
- [ ] Add admin override for emergency evictions (e.g., illegal activity)
- [ ] Write E2E tests for both flows

---

## Compliance \u0026 Legal Review

**Legal Jurisdiction**: Vietnam (assumes Vietnamese rental law)

**Key Legal Requirements Met**:
- ✅ Tenant protection: 60-day notice for eviction (stricter than most laws)
- ✅ Tenant rights: Dispute mechanism within 14 days
- ✅ Landlord protection: Penalty for early tenant move-out
- ✅ Evidence requirement: Eviction must have documented grounds
- ✅ Audit trail: All terminations logged to event store

**Legal Disclaimer**:
This is a software design decision, NOT legal advice. Consult a Vietnamese property lawyer before deploying to production.

---

## Sign-Off

**Decision Approved By**:
- [ ] System Architect
- [ ] Lead Backend Engineer
- [ ] Product Owner
- [ ] Legal Advisor (if available)

**Implementation Owner**: Backend Team  
**Review Date**: Before production deployment

---

## Appendix: Code Example

```typescript
// Tenant early move-out
await contractLifecycleService.terminate({
  contractId: '123',
  initiator: 'TENANT',
  terminationDate: new Date('2026-03-01'),  // 30+ days from now
  reason: 'Job relocation to Hanoi',
  userId: tenantUserId
});

// Landlord eviction
await contractLifecycleService.evict({
  contractId: '123',
  initiator: 'LANDLORD',
  evictionDate: new Date('2026-04-15'),  // 60+ days from now
  evictionGround: EvictionGround.NON_PAYMENT,
  evidence: ['s3://invoices/overdue-proof.pdf'],
  userId: landlordUserId
});
```

---

**DECISION FINALIZED**: 2026-01-23
