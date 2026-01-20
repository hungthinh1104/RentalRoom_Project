# Backend Module Scan Findings

**Session Date:** 2026-01-18  
**Status:** In Progress (5/6 modules scanned)

---

## Summary by Module

### ✅ AUTH-001: Complete & Fixed
- **Status:** COMPLETED ✓
- **Critical Issues Fixed:** 5
  1. Token collision (reset token overwrote email verification code)
  2. Weak token entropy (Math.random() → crypto.randomBytes)
  3. Ban enforcement (3-level: login, JWT, refresh)
  4. Stateless refresh tokens (family tracking + revocation)
  5. Weak password policy (8+ chars, uppercase, lowercase, number, special)

---

### 🔴 USERS-001: Critical Issues Identified
- **Status:** IN PROGRESS - REQUIRES FIXES

#### Tenants Module Issues:
1. **Search Filter Bug** (FilterTenantsDto)
   - DTO references non-existent fields: `fullName`, `email`, `phoneNumber`
   - Tenant model only has: `userId`, `dateOfBirth`, `citizenId`, `emergencyContact`, `budgetMin/Max`, `preferredLocation`, `employmentStatus`, `isVerified`
   - **Impact:** Search queries will fail or return no results
   - **Fix:** Either add fields to model or fix DTO filter logic (join with User table for full name/email)

2. **Missing Ownership Check** (tenants.controller.ts:40)
   - `update()` endpoint decorated with `@Auth()` only (ANY authenticated user can edit ANY tenant)
   - Service layer has NO ownership validation
   - **Impact:** CRITICAL - User A can modify User B's tenant profile
   - **Fix:** Add CurrentUser check + service-layer ownership validation (check tenantId belongs to user.id)

#### Landlords Module Issues:
- Same search filter bug as Tenants
- Same ownership issue pattern (update() lacks CurrentUser validation)

#### Users Module:
- ✅ Scanned, no critical issues (password policy now enforced by auth refactoring)

---

### ✅ PROPERTIES-001: Good Implementation
- **Status:** READY FOR DEEP SCAN
- **Key Strength:** Proper ownership guards implemented
  - `update()/delete()` use `@UseGuards(PropertyOwnerGuard)` ✓
  - Landlords filtered to own properties only ✓

---

### ✅ ROOMS-001: Good Implementation  
- **Status:** SCANNED - READY FOR INTEGRATION TEST
- **Key Strength:** Service-layer ownership checks
  - Review system properly scoped (tenant/landlord replies)
  - Bulk create endpoint present
  - OptionalJwtAuthGuard for public browsing ✓

---

### 🟡 CONTRACTS-001: Complex Module (Partial Scan)
- **Status:** PENDING DEEP SCAN
- **Submodules Identified:**
  - applications/ (rental applications)
  - signing/ (contract signing flow)
  - lifecycle/ (contract lifecycle management)
  - residents/ (tenant/resident tracking)
  - core/ (core contract logic)
- **Guard Pattern:** Uses ContractPartyGuard
- **Action Required:** Complete deep-dive scan (362-line controller, multiple endpoints)

---

### 🟡 PAYMENTS-001: Security Gaps Identified
- **Status:** REQUIRES FIX
- **Issues Found:**

1. **Missing Ownership Check on Update** (payments.controller.ts:116)
   - `@Patch(':id')` decorated with `@Auth(UserRole.ADMIN, UserRole.LANDLORD)`
   - Service `update()` method has NO landlord ownership validation
   - **Impact:** Landlord A can modify Landlord B's payments
   - **Fix:** Add landlord ownership check in service (verify invoice.contract.landlordId === user.id)

2. **Missing Ownership Check on Delete** (payments.controller.ts:133)
   - `@Delete(':id')` decorated with `@Auth(UserRole.ADMIN, UserRole.LANDLORD)`
   - Service `remove()` method has NO ownership validation
   - **Impact:** Landlord A can delete Landlord B's payments
   - **Fix:** Add same ownership validation

3. **Weak QR Generation Validation** (payments.controller.ts:178)
   - `generateInvoiceQr()` has ownership check ✓
   - BUT: `generateQr()` only validates landlordId matches (loose validation)
   - Should also validate payment amount/reference

4. **Payment Verification Bypass Risk** (payment-webhook.service.ts)
   - Webhook signature verification implemented ✓
   - BUT: tenantId in webhook payload not validated (could be spoofed in initial request)
   - Should verify against contract records

---

### 🟡 MAINTENANCE-001: Mostly Good, One Issue
- **Status:** MOSTLY GOOD - ONE FIX REQUIRED

1. **Missing Complete() Ownership Check** (maintenance.service.ts:189)
   - `complete()` method has NO ownership validation
   - Decorated with `@Auth(UserRole.ADMIN, UserRole.LANDLORD)` in controller
   - **Impact:** Landlord A can mark Landlord B's maintenance requests as complete
   - **Fix:** Add room ownership check (verify room.property.landlordId === user.id)

2. **Good Implementation:**
   - ✅ `update()` has proper landlord ownership check (line 169)
   - ✅ `remove()` is admin-only (line 185)
   - ✅ Service layer validates ownership correctly

---

## Prioritized Refactoring List

### Tier 1: CRITICAL (Fix Immediately)
1. **USERS-001** - Tenant update() missing ownership check
2. **PAYMENTS-001** - Payment update/delete missing ownership checks
3. **MAINTENANCE-001** - Complete() missing ownership check

### Tier 2: HIGH (Fix Before Deployment)
1. **USERS-001** - Search filter bugs (Tenants/Landlords)
2. **PAYMENTS-001** - QR generation and webhook validation improvements
3. **CONTRACTS-001** - Complete deep-scan (not yet assessed)

### Tier 3: MEDIUM (Quality Improvements)
1. Standardize ownership guard patterns across modules
2. Add comprehensive ownership validation tests
3. Document guard decorator + service-layer validation pattern

---

## Guard Pattern Analysis

### ✅ Best Practice (Properties/Rooms)
```typescript
@Patch(':id')
@Auth(UserRole.LANDLORD)
@UseGuards(PropertyOwnerGuard)  // Guard validates ownership
update(@Body() dto: UpdatePropertyDto) { ... }
```

### ⚠️ Incomplete (Tenants/Payments/Maintenance)
```typescript
@Patch(':id')
@Auth(UserRole.LANDLORD)  // No guard, no CurrentUser validation
update(@Body() dto: UpdateTenantDto) { ... }
```

### ✅ Alternative (with CurrentUser)
```typescript
@Patch(':id')
@Auth(UserRole.LANDLORD)
update(
  @Param('id') id: string,
  @CurrentUser() user: User,
  @Body() dto: UpdateDto
) {
  // Service must validate: resource.landlordId === user.id
}
```

---

## Next Actions

1. **Complete USERS-001 Fixes:**
   - [ ] Add ownership check to tenant.update()
   - [ ] Fix search filter DTOs (join User or use existing fields)
   - [ ] Test with actual tenant data

2. **Complete PAYMENTS-001 Fixes:**
   - [ ] Add ownership check to payment.update()
   - [ ] Add ownership check to payment.remove()
   - [ ] Review webhook validation logic

3. **Complete MAINTENANCE-001 Fixes:**
   - [ ] Add ownership check to maintenance.complete()

4. **Deep-Scan CONTRACTS-001:**
   - [ ] Review all contract CRUD operations
   - [ ] Check signing flow security
   - [ ] Verify rental application access controls

5. **Comprehensive Testing:**
   - [ ] Unit tests for ownership checks
   - [ ] Integration tests for multi-tenant isolation
   - [ ] E2E tests for critical flows

---

## Statistics

| Module | Status | Issues | Severity |
|--------|--------|--------|----------|
| AUTH | ✅ Complete | 0 | - |
| USERS | 🟡 Scanning | 2 | 🔴🔴 |
| PROPERTIES | ✅ Scanned | 0 | - |
| ROOMS | ✅ Scanned | 0 | - |
| CONTRACTS | ⏳ Pending | ? | ? |
| PAYMENTS | 🟡 Scanning | 4 | 🔴🔴🟡🟡 |
| MAINTENANCE | 🟡 Scanning | 1 | 🔴 |

**Total Issues Found:** 9 (3 CRITICAL, 6 HIGH/MEDIUM)
