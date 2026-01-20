# Database Schema Migrations

## Overview
Four critical Prisma schema updates required to support security enhancements from UC audit.
Execute in order to prevent foreign key constraint violations.

---

## Migration 1: Version Tracking for Contracts & Rooms
**Purpose**: Enable version control + audit trail for contract and room amendments

### Migration File
```prisma
// prisma/migrations/20260128000000_add_version_columns/migration.sql

-- Add version and updated_at columns to contract
ALTER TABLE "Contract" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Contract" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Contract" ADD COLUMN "contract_hash" TEXT;

-- Add version and updated_at columns to room
ALTER TABLE "Room" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Room" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for version queries
CREATE INDEX "Contract_version_idx" ON "Contract"("id", "version");
CREATE INDEX "Room_version_idx" ON "Room"("id", "version");
```

### Prisma Schema Changes
```prisma
model Contract {
  // ... existing fields ...
  version Int @default(1) // Incremented on amendment
  updatedAt DateTime @updatedAt // Auto-managed by Prisma
  contractHash String? // SHA256 hash from ContractHashService
  
  @@index([id, version])
}

model Room {
  // ... existing fields ...
  version Int @default(1)
  updatedAt DateTime @updatedAt
  
  @@index([id, version])
}
```

### Impact
- No existing data loss
- New fields nullable/default, safe for existing records
- Enables contract amendment audit trails
- Supports UC_COT_02 (contract hash verification)

---

## Migration 2: Payment Transaction Idempotency Table
**Purpose**: Prevent duplicate payment processing (UC_PAY_01 replay attack prevention)

### Migration File
```prisma
// prisma/migrations/20260128000001_create_payment_transactions/migration.sql

CREATE TABLE "PaymentTransaction" (
    id SERIAL PRIMARY KEY,
    "transactionId" TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    amount BIGINT NOT NULL, -- Store in cents (BIGINT for precision)
    "paymentMethod" TEXT,
    "referenceCode" TEXT NOT NULL UNIQUE,
    "responseData" JSONB,
    "errorDetails" TEXT,
    "processedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "PaymentTransaction_transactionId_idx" ON "PaymentTransaction"("transactionId");
CREATE INDEX "PaymentTransaction_referenceCode_idx" ON "PaymentTransaction"("referenceCode");
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");
```

### Prisma Schema Addition
```prisma
model PaymentTransaction {
  id Int @id @default(autoincrement())
  transactionId String @unique // External transaction ID from bank
  status String // PENDING | SUCCESS | FAILED
  amount BigInt // Amount in cents/dong
  paymentMethod String?
  referenceCode String @unique // Dynamic reference code per transaction
  responseData Json? // Full API response from bank
  errorDetails String? // Error reason if FAILED
  processedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([transactionId])
  @@index([referenceCode])
  @@index([createdAt])
}
```

### Integration Point
- PaymentIdempotencyMiddleware checks this table
- On duplicate transactionId, returns cached response
- Prevents double-charging for network retries

---

## Migration 3: Bad Debt Invoices
**Purpose**: Track unpaid invoices when tenant moves out (UC_COT_03 debt tracking)

### Migration File
```prisma
// prisma/migrations/20260128000002_create_bad_debt_invoices/migration.sql

CREATE TABLE "BadDebtInvoice" (
    id SERIAL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    amount BIGINT NOT NULL, -- In cents/dong
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COLLECTION', 'WRITTEN_OFF')),
    "dueDate" TIMESTAMP,
    "paidAt" TIMESTAMP,
    "paidAmount" BIGINT,
    "collectionAttempts" INTEGER DEFAULT 0,
    "collectionNotes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "User"(id),
    FOREIGN KEY ("contractId") REFERENCES "Contract"(id)
);

CREATE INDEX "BadDebtInvoice_tenantId_idx" ON "BadDebtInvoice"("tenantId");
CREATE INDEX "BadDebtInvoice_contractId_idx" ON "BadDebtInvoice"("contractId");
CREATE INDEX "BadDebtInvoice_status_idx" ON "BadDebtInvoice"("status");
```

### Prisma Schema Addition
```prisma
model BadDebtInvoice {
  id Int @id @default(autoincrement())
  tenantId String
  tenant User @relation(fields: [tenantId], references: [id], name: "badDebtInvoices")
  contractId String
  contract Contract @relation(fields: [contractId], references: [id], name: "badDebtInvoices")
  amount BigInt // Amount owed
  reason String // e.g., "Unpaid rent for Mar 2025", "Damage deduction dispute"
  status String // ACTIVE | COLLECTION | WRITTEN_OFF
  dueDate DateTime?
  paidAt DateTime?
  paidAmount BigInt? // Partial payment support
  collectionAttempts Int @default(0)
  collectionNotes String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([contractId])
  @@index([status])
}
```

### Related Models Update
```prisma
model User {
  // ... existing fields ...
  badDebtInvoices BadDebtInvoice[] @relation("badDebtInvoices")
}

model Contract {
  // ... existing fields ...
  badDebtInvoices BadDebtInvoice[] @relation("badDebtInvoices")
}
```

---

## Migration 4: Room Status Enum Enhancement
**Purpose**: Add PENDING_HANDOVER state (UC_TENANT_01 - prevent premature room unlock)

### Current Room Status Enum
```prisma
enum RoomStatus {
  DRAFT
  PENDING
  REJECTED
  AVAILABLE
  OCCUPIED
  UNAVAILABLE
}
```

### Updated Room Status Enum
```prisma
enum RoomStatus {
  DRAFT
  PENDING
  REJECTED
  AVAILABLE
  PENDING_HANDOVER  // ← NEW: After tenant move-out, before landlord confirms clean
  OCCUPIED
  UNAVAILABLE
}
```

### Migration SQL
```sql
-- PostgreSQL: Add enum value
ALTER TYPE "RoomStatus" ADD VALUE 'PENDING_HANDOVER' BEFORE 'OCCUPIED';
```

### Logic Changes
**File**: [contract-lifecycle.service.ts](../src/modules/contract/contract-lifecycle.service.ts#L850-L880)

```typescript
// Before termination complete:
room.status = RoomStatus.PENDING_HANDOVER; // Not immediately AVAILABLE

// After landlord confirms handover:
room.status = RoomStatus.AVAILABLE; // Now bookable by next tenant
```

### State Transition Rules
```
OCCUPIED 
  ↓ (Tenant initiates move-out)
PENDING_HANDOVER (Landlord inspection, 24-48 hours)
  ↓ (Landlord confirms "Handover Complete")
AVAILABLE (Ready for next booking)
```

---

## Migration Execution Order
1. **First**: Run Migration 1 (version columns) - no dependencies
2. **Second**: Run Migration 2 (payment transactions) - standalone table
3. **Third**: Run Migration 3 (bad debt) - references User + Contract
4. **Fourth**: Run Migration 4 (room status) - enum change only

## Deployment Checklist
- [ ] Backup production database before migrations
- [ ] Run migrations on staging environment first
- [ ] Verify no errors in Prisma generate after schema update
- [ ] Test ContractHashService with new contract_hash column
- [ ] Test PaymentIdempotencyMiddleware against PaymentTransaction table
- [ ] Confirm PENDING_HANDOVER state works in room lifecycle
- [ ] Verify bad debt invoice creation in UC_COT_03 flow
- [ ] Run integration tests for all affected services

## Rollback Plan
Each migration is independent:
- Drop new tables: `DROP TABLE BadDebtInvoice, PaymentTransaction;`
- Remove columns: `ALTER TABLE Contract DROP COLUMN version, contract_hash, updated_at;`
- Revert enum: Use database tool to remove PENDING_HANDOVER from RoomStatus enum
