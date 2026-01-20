# Project Completeness & Maturity Analysis
**Role**: Software Analyst
**Objective**: Identify gaps between current "MVP Plus" state and a "Commercial Grade" product.

## 1. Rental Lifecycle (The "Real World" Gaps)
*Current Maturity: 70%*

### ✅ What we have (Happy Path)
*   Search -> Book -> Contract Sign -> Move In -> Monthly Pay.
*   Maintenance Request -> Fix -> Close.

### ⚠️ Critical Missing "Real World" Scenarios
1.  **Contract Termination / Early Checkout**
    *   *Scenario*: Tenant needs to leave before contract ends.
    *   *Gap*: System has no flow for "Request Termination", "Calculate Penalty", "Refund Deposit". Currently, Landlord likely just "Deletes" or "Updates" manually?
    *   *Impact*: Operations are messy and reliant on manual trust.
2.  **Contract Renewal**
    *   *Scenario*: Contract ends next month. Tenant wants to stay 6 more months.
    *   *Gap*: No "One-click Renew" flow to generic new Appendix/Contract.
3.  **Room Switching**
    *   *Scenario*: Tenant wants to move from Room 101 to Room 202 in same building.
    *   *Gap*: Requires "Terminate A -> Sign B". No smooth transition of Deposit.

## 2. Financial Maturity (Money Management)
*Current Maturity: 60%*

### ✅ What we have
*   Auto-generated Monthly Invoices (Service + Rent).
*   QR Payment & Auto-Reconciliation.

### ⚠️ Critical Missing Scenarios
1.  **Deposit Lifecycle Management**
    *   *Scenario*: Contract ends. Landlord deducts 500k for broken chair, returns rest.
    *   *Gap*: No "Deduction Logic" or "Refund Proof" tracking.
2.  **Expense Tracking (P&L)**
    *   *Scenario*: Landlord spends 2M repairing AC.
    *   *Gap*: System tracks Revenue (Invoices) but not Expenses. Landlord cannot see "Net Profit" (ROI) of the property.
    *   *Solution*: Add `Expenses` module linked to Properties.
3.  **Partial / Late Payments**
    *   *Scenario*: Tenant transfers 3M (owes 5M).
    *   *Gap*: `SepayService` checks `amount >= expected`. It likely REJECTS underpayment? Or accepts but leaves Invoice UNPAID? Need "Partial Payment" logic to allow cumulative payments.

## 3. Communication & Operations
*Current Maturity: 50%*

### ✅ What we have
*   Email OTP.
*   Notifications (Db based) for Maintenance.

### ⚠️ Critical Missing Scenarios
1.  **In-App Chat / Direct Messaging**
    *   *Why*: Maintenance requires back-and-forth discussion ("When can you come?", "Is 2pm okay?").
    *   *Gap*: Users likely switch to Zalo/Messenger. System loses context.
2.  **Announcement Board**
    *   *Scenario*: "Water cut tomorrow 9AM-5PM".
    *   *Gap*: Landlord has to email/Zalo everyone. Needs "Broadcast Notification" feature.

## 4. Recommendation Roadmap
To reach **100% Completeness**, priority should be:

1.  **Phase A: Lifecycle Completion (High Value)**
    *   Implement **Contract Liquidation Flow** (Termination + Deposit Refund).
    *   Implement **Contract Renewal**.
2.  **Phase B: Operational Polish**
    *   Add **Expense/P&L Dashboard** for Landlords.
    *   Add **Broadcast Announcements**.
3.  **Phase C: Advanced Payment**
    *   Support **Partial Payments** (Wallet style).
