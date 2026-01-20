# Backend Service Audit & Scenario Verification

This document tracks the deep-dive analysis of the Backend Services (`rentalroom-be`) to verify that business logic (scenarios) is implemented correctly and robustly.

## 1. Authentication & Identity (`AuthService`)
**Goal**: Verify the hybrid Auth flow (JWT + NextAuth) and security mechanisms.
- [x] Registration Flow: **Verified**.
    - Security: Transactional creation (User + Role Table). Admin creation blocked.
    - Password: Policy enforced (8 chars, 1 upper, 1 lower, 1 num, 1 special).
- [x] Login Flow: **Verified**.
    - Tokens: Returns Access (1d) + Refresh (7d).
- [x] Session Handling: **Robust**.
    - Token Rotation: Implements "Token Family" to detect reuse. If a used refresh token is tried again -> Revokes entire family (prevent account takeover).
- [x] **Scenario Check**: "User registers -> reset pw -> login -> logout" logic holds up.
    - Password Reset: Cryptographically strong token (128 char random bytes).
    - Logout: Revokes token family immediately.

## 2. Digital Contracts (`ContractsService` & `SigningService`)
**Goal**: Verify the multi-step contract lifecycle and async PDF generation.
- [x] Creation & Validation: **Verified**.
    - Robustness: Transactional Room Status locking (`AVAILABLE` -> `DEPOSIT_PENDING`). Prevents double-booking.
- [x] PDF Generation: **Resilient**.
    - Storage: Tries local `storage/contracts`. If permission denied, falls back to `os.tmpdir()` (Safe failover).
    - Integrity: Hashes PDF immediately upon generation (`pdfHash`).
- [x] Digital Signing: **Verified**.
    - Logic: Checks against original hash. Embeds signature. Updates `signatureStatus`.
    - Audit: Logs metadata (IP, User Agent) for non-repudiation.
- [x] **Scenario Check**: "Landlord creates -> Tenant signs" works.
    - Tenant signing triggers `eSignatureUrl` update.
    - System can Verify signature validity via `verifyPDF` (crypto check).

## 3. Smart Payments (`PaymentsService` & `SepayService`)
**Goal**: Verify the automated payment reconciliation logic.
- [x] QR Generation: **Verified**.
    - Integration: Uses `qr.sepay.vn` dynamic API with Bank Config from DB.
- [x] Webhook Processing: **Verified** (via Polling/Verification API).
    - Smart Matching: Normalizes content (removes special chars, uppercase) to match `paymentRef` even if user types sloppily.
    - Amount Check: Logic uses `>= expectedAmount` (allows slight overpayment, rejects underpayment).
- [x] Invoice Reconciliation: **Automated**.
    - Flow: Payment Verified -> Invoice `PAID` -> Contract `ACTIVE` -> Room `OCCUPIED`. All in one transaction.
- [x] **Scenario Check**: "Tenant pays -> System auto-activates" is fully implemented in `ContractLifecycleService.verifyPaymentStatus`.

## 4. Room & Search (`RoomsService` & `AIService`)
**Goal**: Verify the Search algorithms and listing management.
- [ ] Hybrid Search Logic (Vector distance + SQL Filters)
- [ ] Review/Reply Logic
- [ ] **Scenario Check**: "Tenant searches 'cheap room near uni' -> AI translates to Vector -> DB filters price -> Results returned"

---
## Findings & Gaps
*(To be populated during audit)*
-
