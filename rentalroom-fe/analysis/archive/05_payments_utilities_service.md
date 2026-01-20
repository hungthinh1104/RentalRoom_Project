# Service Analysis: Payments & Utilities

## 1. Executive Summary
This service handles financial transactions and utility tracking.
-   **Status**: Mixed. "Unified" but complex.
-   **Payments**: Functional but tightly coupled with Frontend logic.
-   **Utilities**: "Unified Invoice" approach is powerful but `UnifiedInvoiceTable.tsx` is a "God Component".

## 2. Architecture Overview
-   **Payments API**: `src/features/payments/api`.
-   **Utilities API**: `src/features/utilities/api`.
-   **Integration**: `UnifiedInvoiceTable.tsx` (in `src/features/utilities/components`) is the central hub.

## 3. Key Findings

### 🔴 [Architecture] The "God Component"
**Location**: `src/features/utilities/components/UnifiedInvoiceTable.tsx`
**Issue**: This 500+ line component handles:
1.  Fetching Contracts/Invoices/Services.
2.  Managing local state for readings.
3.  Calculating estimated costs in the UI (`calculateEstimate`).
4.  Submitting Invoices.
**Risk**: UI pricing logic often drifts from Backend logic. If the backend adds a "Tiered Pricing" model for electricity, this UI header will show wrong estimates.

### 🟡 [Performance] Landlord Finance Page
**Location**: `src/app/dashboard/landlord/finance/page.tsx`
**Issue**: A 16KB Client Component. It loads ALL active contracts, then iterates them to build a summary.
**Impact**: Slow initial render for landlords with many properties.

### 🟢 [Feature] Unified Usage
**Observation**: The ability to input readings and generate invoices in one screen is a strong UX feature, avoiding context switching.

## 4. Recommendations
1.  **Refactor Finance Page**: Move data fetching to Server Components (like we did for Tenant Finance).
2.  **Logic Shift**: Move `calculateEstimate` logic to a dedicated hook `useInvoiceEstimation` or, better, an API endpoint `POST /invoices/preview`.
