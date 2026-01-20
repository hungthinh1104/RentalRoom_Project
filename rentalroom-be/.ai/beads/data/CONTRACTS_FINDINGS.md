# CONTRACTS Module - Deep Scan Findings

**Session:** Backend Audit #2  
**Module:** CONTRACTS & RENTAL APPLICATIONS  
**Status:** IN PROGRESS - 1 New Issue Identified  

---

## Architecture Overview

The Contracts module is highly complex with 813 lines in the lifecycle service alone and multiple submodules:

```
contracts/
├── applications/              (Rental applications)
│   └── contract-application.service.ts (512 lines)
├── lifecycle/                 (Contract lifecycle management)
│   └── contract-lifecycle.service.ts (813 lines)
├── signing/                   (Digital signatures)
├── residents/                 (Occupancy/resident tracking)
├── controllers/               (Template management)
├── core/                      (Core business logic)
└── shared/                    (Scheduler, utilities)
```

---

## Security Findings

### ✅ GOOD: ContractPartyGuard Implementation
**File:** `src/common/guards/contract-party.guard.ts`

**Strength:**
- ✓ Properly validates contract parties (landlord, tenant, admin)
- ✓ Prevents unauthorized access to contract details
- ✓ Used on `findOne()` and `update()` endpoints with `@UseGuards(ContractPartyGuard)`
- ✓ Comprehensive party checks:
  ```typescript
  const isAdmin = user.role === 'ADMIN' || user.role === 'SYSTEM';
  const isLandlord = contract.room?.property?.landlord?.userId === user.id;
  const isTenant = contract.tenant?.userId === user.id;
  
  if (!isAdmin && !isLandlord && !isTenant) {
    throw new ForbiddenException('You are not a party to this contract');
  }
  ```

---

### 🔴 CRITICAL: Missing Ownership Check on Application Approval
**File:** `src/modules/contracts/applications/contract-application.service.ts:284`  
**Endpoint:** `PATCH /contracts/applications/:id/approve`  
**Decorator:** `@Auth(UserRole.ADMIN, UserRole.LANDLORD)` (no CurrentUser)

**Issue:**
```typescript
async approveApplication(id: string) {
  const application = await this.findOneApplication(id);
  // ❌ NO OWNERSHIP VALIDATION!
  // Any landlord can approve any rental application
  // This allows Landlord A to approve applications for Landlord B's properties
  
  const result = await this.prisma.$transaction(async (tx) => {
    // Creates contract + updates room status + sends notifications
    // All without verifying landlord ownership
  });
}
```

**Impact:**
- Landlord A can approve applications for Landlord B's rental rooms
- Can artificially inflate application counts
- Could approve incompatible tenants for competitors' properties
- Causes contract + invoicing issues

**Severity:** 🔴 CRITICAL

**Fix Required:**
```typescript
async approveApplication(id: string, landlordUserId: string) {
  const application = await this.findOneApplication(id);
  
  // ✅ VALIDATE OWNERSHIP
  const landlord = await this.prisma.landlord.findUnique({
    where: { userId: landlordUserId },
  });
  
  if (application.landlordId !== landlord?.id) {
    throw new ForbiddenException(
      'You can only approve applications for your properties',
    );
  }
  
  // ... rest of logic
}
```

And update controller:
```typescript
@Patch('applications/:id/approve')
@Auth(UserRole.ADMIN, UserRole.LANDLORD)
approveApplication(
  @Param('id') id: string,
  @CurrentUser() user: User,
) {
  return this.contractsService.approveApplication(id, user.id);
}
```

---

### 🔴 CRITICAL: Missing Ownership Check on Application Rejection
**File:** `src/modules/contracts/applications/contract-application.service.ts`  
**Endpoint:** `PATCH /contracts/applications/:id/reject`  

**Issue:** Same as approval - no landlord validation

**Fix:** Apply same pattern as approveApplication fix

---

### ✅ GOOD: Tenant-Specific Validations
**File:** `src/modules/contracts/applications/contract-application.service.ts`

**Good Patterns:**
```typescript
// withdrawApplication validates tenant ownership
async withdrawApplication(id: string, userId: string) {
  const application = await this.findOneApplication(id);
  
  if (application.tenantId !== userId) {
    throw new UnauthorizedException('Only the applicant can withdraw');
  }
}

// requestChanges validates tenant
async requestChanges(contractId: string, tenantId: string, reason: string) {
  const contract = await this.findOne(contractId);
  if (contract.tenantId !== tenantId) {
    throw new UnauthorizedException('Only tenant can request changes');
  }
}
```

---

### ⚠️ MEDIUM: Missing CurrentUser in Contract Signing Endpoints
**Files:**
- `POST :id/generate-pdf` (line 219)
- `POST :id/sign` (line 243)
- `GET :id/verify` (line 309)
- `GET :id/pdf` (line 330)

**Issue:**
```typescript
@Post(':id/generate-pdf')
@Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
async generateContractPDF(
  @Param('id') id: string,
  @Body('templateName') templateName: string = 'rental-agreement',
) {
  // ❌ No CurrentUser - anyone can generate PDF for any contract
  // Should be protected by ContractPartyGuard
}
```

**Status:** Partially mitigated if service-layer validates, but missing explicit guard

**Fix:** Add `@UseGuards(ContractPartyGuard)` decorator

---

### ✅ GOOD: Resident Management Validates Parties
**File:** `src/modules/contracts/contracts.controller.ts:186`

```typescript
@Post(':id/residents')
@Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
addResident(
  @Param('id') id: string,
  @Body() dto: CreateContractResidentDto,
  @CurrentUser() user: User,  // ✓ Gets user
) {
  return this.contractsService.addResident(id, dto, user.id);
  // Service should validate ownership
}
```

---

### ✅ GOOD: Contract Termination Has Party Check
**File:** `src/modules/contracts/contracts.controller.ts:161`

```typescript
@Patch(':id/terminate')
@Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
terminate(
  @Param('id') id: string,
  @Body() terminateDto: TerminateContractDto,
  @CurrentUser() user: User,  // ✓ Gets user
) {
  return this.contractsService.terminate(id, user.id, terminateDto);
}
```

---

## Summary of Issues Found

| Endpoint | Issue | Severity | Status |
|----------|-------|----------|--------|
| PATCH /contracts/applications/:id/approve | Missing landlord ownership validation | 🔴 CRITICAL | Not Fixed |
| PATCH /contracts/applications/:id/reject | Missing landlord ownership validation | 🔴 CRITICAL | Not Fixed |
| POST /contracts/:id/generate-pdf | Missing ContractPartyGuard | ⚠️ MEDIUM | Not Fixed |
| POST /contracts/:id/sign | Missing ContractPartyGuard | ⚠️ MEDIUM | Not Fixed |
| GET /contracts/:id/verify | Missing ContractPartyGuard | ⚠️ MEDIUM | Not Fixed |
| GET /contracts/:id/pdf | Missing ContractPartyGuard | ⚠️ MEDIUM | Not Fixed |

**Total New Issues:** 6 (2 critical, 4 medium)

---

## Recommended Fix Priority

### Tier 1: Fix Immediately (Critical)
1. `approveApplication()` - Add landlord ownership check
2. `rejectApplication()` - Add landlord ownership check

### Tier 2: Fix Before Deployment (Medium)
3. Add `@UseGuards(ContractPartyGuard)` to:
   - POST /contracts/:id/generate-pdf
   - POST /contracts/:id/sign  
   - GET /contracts/:id/verify
   - GET /contracts/:id/pdf

### Tier 3: Code Quality (Low)
- Standardize ownership validation pattern across module
- Add comprehensive test coverage for party validation

---

## Next Steps

1. **Implement Fixes for 2 Critical Issues**
   - Update contract-application.service.ts methods
   - Update contracts.controller.ts endpoints

2. **Add Guards to 4 Medium Issues**
   - Add @UseGuards(ContractPartyGuard) decorators
   - Verify service-layer validation

3. **Test All Changes**
   - Verify Landlord A cannot approve Landlord B's applications
   - Verify non-parties cannot access contract PDFs
   - Test admin override functionality

4. **Review Remaining Submodules**
   - Signing module: Check signature verification
   - Lifecycle module: Review all state transitions
   - Residents module: Verify occupancy controls

---

**Scan Date:** 2026-01-18  
**Scan Status:** IN PROGRESS  
**Next Review:** After implementing critical fixes
