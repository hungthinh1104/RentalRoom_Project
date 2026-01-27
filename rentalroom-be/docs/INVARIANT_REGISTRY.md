# System Invariant Registry

**Purpose**: This document defines the **system contracts** that must NEVER be violated. These are not "business rules" (which can change), but **fundamental truths** about how the system operates.

**Authority**: Production deployment MUST NOT proceed if any invariant is violated.

---

## Invariant Categories

1. **State Invariants** (INV_STATE_xx) - State machine guarantees
2. **Financial Invariants** (INV_FIN_xx) - Money correctness
3. **Legal Invariants** (INV_LEGAL_xx) - Audit trail integrity
4. **Lifecycle Invariants** (INV_LIFE_xx) - Entity relationships
5. **Security Invariants** (INV_SEC_xx) - Access control guarantees

---

## 1. STATE INVARIANTS

### INV_STATE_01: Terminal States Are Immutable
**Rule**: Once an entity reaches a terminal state, it CANNOT transition to any other state.

**Terminal States**:
- Payment: `COMPLETED`
- Invoice: `PAID`
- Contract: `TERMINATED`, `EXPIRED`, `CANCELLED`
- MaintenanceRequest: `COMPLETED`, `CANCELLED`
- Dispute: `RESOLVED`, `CLOSED`

**Enforcement**:
- `StateMachineGuard.validateTransition()` MUST reject all transitions FROM terminal states
- Database triggers MAY enforce this at DB level

**Violation Detection**:
- Daily integrity cron checks for state changes after terminal
- Event store logs ALL attempted transitions (including rejected)

---

### INV_STATE_02: Active Contract Requires Completed Deposit
**Rule**: A Contract can only be `ACTIVE` if the associated deposit payment is `COMPLETED`.

**Formal Definition**:
```
∀ contract: Contract.status = ACTIVE ⇒ 
  ∃ payment: Payment where:
    - payment.contractId = contract.id
    - payment.type = DEPOSIT
    - payment.status = COMPLETED
```

**Enforcement**:
- `ContractLifecycleService.verifyPaymentStatus()` MUST check payment before ACTIVE
- State machine transition `DEPOSIT_PENDING → ACTIVE` requires payment proof

**Violation Detection**:
- `LegalIntegrityCron` queries for ACTIVE contracts without COMPLETED deposits
- Alert severity: CRITICAL

---

### INV_STATE_03: Occupied Room Has Exactly One Active Contract
**Rule**: A room with status `OCCUPIED` MUST have exactly ONE contract with status `ACTIVE`.

**Formal Definition**:
```
∀ room: Room.status = OCCUPIED ⇔ 
  |{c ∈ Contract | c.roomId = room.id ∧ c.status = ACTIVE}| = 1
```

**Enforcement**:
- `ContractLifecycleService.create()` checks room has NO active contracts
- `ContractLifecycleService.terminate()` updates Room.status to AVAILABLE

**Violation Detection**:
- Daily integrity check: `SELECT roomId, COUNT(*) FROM contract WHERE status='ACTIVE' GROUP BY roomId HAVING COUNT(*) > 1`

---

### INV_STATE_04: Pending Handover Prevents New Bookings
**Rule**: A room in `PENDING_HANDOVER` state MUST NOT allow new contract creation until landlord confirms handover.

**Formal Definition**:
```
Room.status = PENDING_HANDOVER ⇒ 
  NO new Contract can be created for this room
```

**Enforcement**:
- `ContractApplicationService.createApplication()` rejects applications for PENDING_HANDOVER rooms
- Room state transition to AVAILABLE only after handover confirmation

---

## 2. FINANCIAL INVARIANTS

### INV_FIN_01: Money Is Always Decimal (Never Float)
**Rule**: ALL financial amounts MUST be stored as `Decimal` type. Float arithmetic is FORBIDDEN.

**Enforcement**:
- Prisma schema enforces `@db.Decimal(10, 2)` for all money fields
- `BillingService`, `PaymentService` use `Decimal.js` for calculations
- TypeScript types reject `number` for money operations

**Violation Detection**:
- Schema migration validation prevents float columns
- Code review enforces Decimal usage

---

### INV_FIN_02: Payment Verification Never Creates Payment
**Rule**: Verifying payment status MUST be idempotent. It can update contract status but MUST NOT create payment records.

**Formal Definition**:
```
verifyPaymentStatus(contractId) is idempotent:
  - MAY update Contract.status
  - MAY append events
  - MUST NOT create Payment records
  - MUST NOT modify existing Payment.amount
```

**Enforcement**:
- `ContractLifecycleService.verifyPaymentStatus()` only queries Payment table
- Payment creation is ONLY in `PaymentService.create()`

---

### INV_FIN_03: Paid Invoice Is Immutable
**Rule**: Once Invoice.status = PAID, the following fields are FROZEN:
- `totalAmount`
- `dueDate`
- `lineItems` (entire collection)

**Enforcement**:
- `ImmutabilityGuard.enforceImmutability()` checks invoice status before update
- Database row-level trigger rejects updates to immutable fields

**Violation Detection**:
- `AdminAuditLog` records ALL attempted modifications to PAID invoices
- Daily integrity check compares current state with event store snapshot

---

### INV_FIN_04: Idempotent Payment Creation
**Rule**: Creating a payment with the same `idempotencyKey` MUST return the cached result, not create duplicate payment.

**Formal Definition**:
```
createPayment(dto, idempotencyKey) where:
  - First call: creates Payment + returns result
  - Subsequent calls with same key: return cached result (24h TTL)
  - Different key: creates new Payment
```

**Enforcement**:
- `IdempotencyGuard.executeIdempotent()` checks IdempotencyRecord table
- Result hash stored for verification

---

## 3. LEGAL INVARIANTS

### INV_LEGAL_01: Events Are Append-Only (Never Modified)
**Rule**: DomainEvent table is append-only. NO UPDATE or DELETE allowed, even by admin.

**Enforcement**:
- Database trigger rejects UPDATE/DELETE on `DomainEvent` table
- `EventStoreService.append()` only uses INSERT
- Admin role explicitly denied UPDATE privilege

**Violation Detection**:
- Hash chain verification detects ANY modification
- Daily integrity check compares event.dataHash with recomputed hash

---

### INV_LEGAL_02: Snapshot Creation Is Atomic With Transaction
**Rule**: Legal snapshot creation MUST be atomic with the business transaction. If snapshot fails, transaction MUST rollback.

**Enforcement**:
- `SnapshotService.create()` is called INSIDE `prisma.$transaction()`
- If snapshot creation throws, entire transaction rolls back

**Violation Detection**:
- Event store records snapshot creation in event metadata
- Missing snapshots trigger alerts

---

### INV_LEGAL_03: Admin Actions Are Immutably Logged
**Rule**: ALL admin actions (especially DELETE) MUST be logged to `AdminAuditLog` with:
- Actor ID
- Action type
- Entity snapshot (before-value)
- Timestamp
- IP address
- Hash chain

**Enforcement**:
- `AdminAuditService.logAdminAction()` wraps all admin controllers
- Failed audit write MUST block admin action

**Violation Detection**:
- Daily hash chain verification
- Suspicious pattern detection (bulk deletes, after-hours access)

---

### INV_LEGAL_04: Contract Signature Verification
**Rule**: Contract with status `ACTIVE` MUST have valid cryptographic signature (SHA-256 hash + HMAC).

**Formal Definition**:
```
Contract.status = ACTIVE ⇒ 
  ∃ signature: ContractSignature where:
    - signature.contractId = contract.id
    - signature.hash = SHA256(contract.content)
    - signature.hmac = HMAC(signature.hash, secret)
    - signature.expiresAt > NOW()
```

**Enforcement**:
- `ContractSigningService` creates signature before ACTIVE transition
- Signature verification on contract retrieval

---

## 4. LIFECYCLE INVARIANTS

### INV_LIFE_01: Application Before Contract
**Rule**: A Contract can only be created if there exists an APPROVED RentalApplication.

**Formal Definition**:
```
∀ contract: Contract ⇒ 
  ∃ application: RentalApplication where:
    - application.id = contract.applicationId
    - application.status = APPROVED
```

**Enforcement**:
- `ContractLifecycleService.create()` validates application existence and status
- Foreign key constraint ensures referential integrity

---

### INV_LIFE_02: Termination Notice Period
**Rule**: Contract termination MUST respect notice period (30 days for tenant early moveout, 60 days for landlord eviction).

**Formal Definition**:
```
terminateContract(contractId, initiator, noticeDate) where:
  - initiator = TENANT ⇒ effectiveDate ≥ noticeDate + 30 days
  - initiator = LANDLORD ⇒ effectiveDate ≥ noticeDate + 60 days
```

**Enforcement**:
- `ContractLifecycleService.terminate()` validates notice period
- State machine allows termination only after notice period elapsed

---

### INV_LIFE_03: Dispute Resolution Deadline
**Rule**: Dispute MUST be resolved within 14 days of creation, or auto-resolve to default outcome.

**Enforcement**:
- `DisputeService.create()` sets deadline = createdAt + 14 days
- Cron job auto-resolves disputes past deadline

---

## 5. SECURITY INVARIANTS

### INV_SEC_01: Tenant Can Only View Own Contracts
**Rule**: Tenant role can ONLY query contracts where `contract.tenantId = user.id`.

**Enforcement**:
- `ContractPartyGuard` validates user is party to contract
- Database query filters by tenantId

**Violation Detection**:
- Unauthorized access logged to SecurityEvent
- Failed attempts trigger rate limiting

---

### INV_SEC_02: eKYC Required Before Contract Signing
**Rule**: User MUST have `ekycVerified = true` before signing any contract.

**Enforcement**:
- `ContractSigningService.sign()` checks user.ekycVerified
- State machine prevents PENDING_SIGNATURE → DEPOSIT_PENDING without eKYC

---

### INV_SEC_03: Payment Replay Attack Prevention
**Rule**: Payment with duplicate `transactionId` MUST be rejected.

**Enforcement**:
- `PaymentService.create()` checks uniqueness of transactionId
- Database unique constraint on Payment.transactionId

---

### INV_SEC_04: Contract Amendment Preserves Hash Chain
**Rule**: Contract amendments MUST increment version and update contractHash to reflect new content.

**Formal Definition**:
```
amendContract(contractId, changes) ⇒
  - Contract.version += 1
  - Contract.contractHash = SHA256(newContent)
  - Event: CONTRACT_AMENDED with oldHash, newHash
```

**Enforcement**:
- `ContractLifecycleService.update()` calls `ContractHashService`
- Hash mismatch triggers integrity alert

---

## Invariant Violation Response

| Severity | Response |
|----------|----------|
| **CRITICAL** | Block transaction, alert on-call engineer, log security event |
| **HIGH** | Block transaction, log audit entry, alert team Slack |
| **MEDIUM** | Allow with warning, log audit entry, daily report |
| **LOW** | Log only, monthly review |

---

## Verification Schedule

- **Real-time**: State machine guards, idempotency checks
- **Hourly**: IdempotencyRecord cleanup
- **Daily**: Hash chain verification, orphaned record detection
- **Weekly**: Full system invariant audit
- **Before Deploy**: Manual invariant checklist sign-off

---

**Last Updated**: 2026-01-23  
**Owner**: System Architect  
**Reviewers**: Lead Engineer, QA Lead, Security Team
