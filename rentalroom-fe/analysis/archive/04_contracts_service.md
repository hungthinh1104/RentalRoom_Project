# Service Analysis: Contracts (Leasing & Digital Signing)

## 1. Executive Summary
This service manages the legal binding between Tenants and Rooms.
- **Status**: Functional & Robust.
- **Workflow**: Automated state machine (Draft -> Sent -> Signed -> Paid -> Active).
- **Core Feature**: "Digital Signing" is implemented as a **Click-wrap Agreement** (Digital Acceptance), which is legally valid but distinct from biometric e-signatures (drawing a signature).

## 2. Architecture Overview

### Components
- **Creation**: `src/app/dashboard/landlord/contracts/create` (Landlord initiates).
- **Approval**: `src/app/dashboard/tenant/contracts` (Tenant reviews & accepts).
- **Visualization**: `ContractApprovalModal` displays terms and enforces "Read & Agree" via checkbox.

### API Integration (`contracts-api.ts`)
- **Lifecycle Methods**: `createContract`, `sendContract`, `tenantApproveContract`, `terminateContract`.
- **Documents**: `generate-pdf-async` and `downloadSigned`.

## 3. Functional Verification

| Feature | Status | Implementation Details | User Story |
| :--- | :--- | :--- | :--- |
| **Creation** | ✅ Functional | Landlord fills form -> `POST /contracts` -> Async PDF Gen. | "As a landlord, I prepare a lease for a new tenant." |
| **Digital Signing** | ✅ Functional | **Click-wrap**: Checkbox "I agree" + Button -> `PATCH /tenant-approve`. | "As a tenant, I review terms and legally accept them." |
| **PDF Generation** | ✅ Functional | Backend-side generation. Frontend downloads Blob. | "As a user, I want a PDF copy of my lease." |
| **Termination** | ✅ Functional | `terminateContract` with notice period calculation. | "As a landlord, I end a lease when a tenant moves out." |

## 4. Key Findings & Issues

### 🟢 [UX] Clear Lifecycle Management
**Location**: `ContractStatusBadge.tsx`
**Observation**: The status flow is very clear to users.
- `DRAFT`: Landlord editing.
- `PENDING_SIGNATURE`: Waiting for Tenant.
- `PENDING_PAYMENT`: Signed, waiting for Deposit.
- `ACTIVE`: Fully valid.

### 🟡 [Feature] "Digital Signing" Expectation
**Observation**: Users might expect to "draw" a signature. The current implementation is a Checkbox (Click-wrap).
**Impact**: This is standard for high-volume SaaS but might feel less "formal" to some Vietnamese landlords.
**Recommendation**: Keep as is for MVP. Consider adding a "Draw Signature" pad later for better UX optics, even if the legal weight is the same.

### 🔴 [Risk] Async PDF Race Condition
**Location**: `CreateContractPage.tsx`
**Issue**: It calls `create` then immediately `generate-pdf-async` then redirects to `payment`.
**Risk**: If the user navigates too fast or the Async job fails silently, the PDF might not be ready when they try to download it on the next screen.

## 5. Recommendations

1.  **Polling for PDF**: Ensure the UI polls for PDF readiness if users try to download it immediately after creation.
2.  **Terminology**: Explicitly use terms like "Xác nhận điện tử" (Electronic Confirmation) to set expectations for the click-wrap flow.
