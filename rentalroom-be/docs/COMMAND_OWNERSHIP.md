# Command Ownership Table

**Purpose**: This document defines the **explicit contract** between actors (User, Admin, System) and commands. It answers:
- WHO can execute a command
- UNDER WHAT preconditions
- WHAT events are emitted
- WHAT invariants must hold

**Authority**: This is the **source of truth** for RBAC implementation and authorization guards.

---

## Command Categories

1. **Authentication Commands** (AUTH_*)
2. **Room Management Commands** (ROOM_*)
3. **Application Commands** (APP_*)
4. **Contract Lifecycle Commands** (CONTRACT_*)
5. **Payment Commands** (PAY_*)
6. **Billing Commands** (BILL_*)
7. **Maintenance Commands** (MAINT_*)
8. **Admin Commands** (ADMIN_*)

---

## 1. AUTHENTICATION COMMANDS

### AUTH_REGISTER: Register New User
| Attribute | Value |
|-----------|-------|
| **Actor** | Anonymous (Guest) |
| **Preconditions** | - Email not already registered<br>- Valid email format<br>- Password meets strength requirements |
| **Postconditions** | - User created with `emailVerified = false`<br>- Email verification code sent |
| **Events Emitted** | `USER_REGISTERED` |
| **Invariants** | INV_SEC_02 (eKYC required before contract) |
| **Side Effects** | Email sent via outbox |

---

### AUTH_LOGIN: User Login
| Attribute | Value |
|-----------|-------|
| **Actor** | Registered User |
| **Preconditions** | - User exists<br>- Password correct<br>- `User.isBanned = false`<br>- Email verified (optional based on config) |
| **Postconditions** | - Access token issued<br>- Refresh token family created |
| **Events Emitted** | `USER_LOGGED_IN` |
| **Invariants** | None |
| **Side Effects** | Token written to cache |

---

### AUTH_VERIFY_EKYC: Complete eKYC Verification
| Attribute | Value |
|-----------|-------|
| **Actor** | Registered User (TENANT or LANDLORD) |
| **Preconditions** | - User exists<br>- Not already verified |
| **Postconditions** | - `User.ekycVerified = true`<br>- `User.ekycProvider` set |
| **Events Emitted** | `EKYC_VERIFIED` |
| **Invariants** | INV_SEC_02 (Required before contract signing) |
| **Side Effects** | Call to external eKYC API (FPT.AI / VNPT) |

---

## 2. ROOM MANAGEMENT COMMANDS

### ROOM_PUBLISH: Create/Publish Room Listing
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD |
| **Preconditions** | - User is LANDLORD<br>- Property exists and owned by landlord<br>- No duplicate room number in property |
| **Postconditions** | - Room created with status `AVAILABLE`<br>- Room.version = 1 |
| **Events Emitted** | `ROOM_PUBLISHED` |
| **Invariants** | None |
| **Side Effects** | Room indexed for search |

---

### ROOM_UPDATE: Update Room Details
| Attribute |Value |
|-----------|-------|
| **Actor** | LANDLORD (owner of property) |
| **Preconditions** | - Room exists<br>- User owns the property<br>- Room NOT in `OCCUPIED` state (or allow limited fields) |
| **Postconditions** | - Room.version += 1<br>- Changes logged |
| **Events Emitted** | `ROOM_UPDATED` |
| **Invariants** | None |
| **Side Effects** | Search index updated |

---

### ROOM_SET_UNAVAILABLE: Mark Room as Unavailable
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD, ADMIN |
| **Preconditions** | - Room exists<br>- Room NOT in `OCCUPIED` |
| **Postconditions** | - `Room.status = UNAVAILABLE`<br>- `Room.unavailableReason` set |
| **Events Emitted** | `ROOM_UNAVAILABLE` |
| **Invariants** | None |
| **Side Effects** | Active applications may be withdrawn |

---

## 3. APPLICATION COMMANDS

### APP_SUBMIT: Submit Rental Application
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT |
| **Preconditions** | - User is TENANT<br>- Room exists and `status = AVAILABLE`<br>- No existing PENDING application by same tenant for same room |
| **Postconditions** | - RentalApplication created with `status = PENDING` |
| **Events Emitted** | `APPLICATION_SUBMITTED` |
| **Invariants** | INV_LIFE_01 (Application before contract) |
| **Side Effects** | Notification sent to landlord |

---

### APP_APPROVE: Approve Rental Application
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (owner of property), ADMIN |
| **Preconditions** | - Application exists<br>- `Application.status = PENDING`<br>- User owns the property (if LANDLORD) |
| **Postconditions** | - `Application.status = APPROVED`<br>- Other PENDING applications for same room → REJECTED |
| **Events Emitted** | `APPLICATION_APPROVED` |
| **Invariants** | None |
| **Side Effects** | Race condition handled via SELECT FOR UPDATE |

---

### APP_REJECT: Reject Rental Application
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (owner), ADMIN |
| **Preconditions** | - Application exists<br>- `Application.status = PENDING` |
| **Postconditions** | - `Application.status = REJECTED`<br>- `Application.rejectionReason` set |
| **Events Emitted** | `APPLICATION_REJECTED` |
| **Invariants** | None |
| **Side Effects** | Notification sent to tenant |

---

### APP_WITHDRAW: Withdraw Application
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT (applicant) |
| **Preconditions** | - Application exists<br>- User is the applicant<br>- `Application.status = PENDING` |
| **Postconditions** | - `Application.status = WITHDRAWN` |
| **Events Emitted** | `APPLICATION_WITHDRAWN` |
| **Invariants** | None |
| **Side Effects** | Landlord notified |

---

## 4. CONTRACT LIFECYCLE COMMANDS

### CONTRACT_CREATE: Create Contract from Approved Application
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (property owner), ADMIN |
| **Preconditions** | - Application exists and `status = APPROVED`<br>- Room has NO active contract<br>- User owns the property |
| **Postconditions** | - Contract created with `status = DRAFT`<br>- `Application.status = COMPLETED`<br>- Contract.version = 1 |
| **Events Emitted** | `CONTRACT_CREATED` |
| **Invariants** | INV_LIFE_01, INV_STATE_03 |
| **Side Effects** | Legal snapshot created |

---

### CONTRACT_SEND: Send Contract to Tenant for Signature
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (contract party), ADMIN |
| **Preconditions** | - Contract exists<br>- `Contract.status = DRAFT` |
| **Postconditions** | - `Contract.status = PENDING_SIGNATURE`<br>- Deposit deadline set (e.g., +7 days) |
| **Events Emitted** | `CONTRACT_SENT` |
| **Invariants** | None |
| **Side Effects** | Notification + PDF sent to tenant |

---

### CONTRACT_APPROVE_TENANT: Tenant Approves Contract
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT (contract party) |
| **Preconditions** | - Contract exists<br>- User is the tenant<br>- `Contract.status = PENDING_SIGNATURE`<br>- User has `ekycVerified = true` |
| **Postconditions** | - `Contract.status = DEPOSIT_PENDING`<br>- Deposit deadline confirmed |
| **Events Emitted** | `CONTRACT_APPROVED` |
| **Invariants** | INV_SEC_02 (eKYC required) |
| **Side Effects** | Payment link generated |

---

### CONTRACT_SIGN: Sign Contract (Digital Signature)
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT, LANDLORD (contract parties) |
| **Preconditions** | - Contract exists<br>- User is party to contract<br>- `Contract.status = DEPOSIT_PENDING` or `PENDING_SIGNATURE` |
| **Postconditions** | - Signature recorded<br>- PDF hash + HMAC generated<br>- `Contract.pdfHash`, `Contract.signedUrl` updated |
| **Events Emitted** | `CONTRACT_SIGNED` (by actor) |
| **Invariants** | INV_LEGAL_04 (Signature verification) |
| **Side Effects** | ContractSignature entry created |

---

### CONTRACT_VERIFY_PAYMENT: Verify Deposit Payment and Activate Contract
| Attribute | Value |
|-----------|-------|
| **Actor** | SYSTEM (automated), ADMIN (manual override) |
| **Preconditions** | - Contract exists<br>- `Contract.status = DEPOSIT_PENDING`<br>- Deposit payment exists and `Payment.status = COMPLETED` |
| **Postconditions** | - `Contract.status = ACTIVE`<br>- `Room.status = OCCUPIED`<br>- `Contract.signedAt` set |
| **Events Emitted** | `CONTRACT_ACTIVATED` |
| **Invariants** | INV_STATE_02, INV_STATE_03, INV_FIN_02 |
| **Side Effects** | None (idempotent) |

---

### CONTRACT_AMEND: Amend Contract Terms
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD, ADMIN |
| **Preconditions** | - Contract exists<br>- `Contract.status != TERMINATED, EXPIRED, CANCELLED` |
| **Postconditions** | - Contract.version += 1<br>- Contract.contractHash updated<br>- Amendment logged |
| **Events Emitted** | `CONTRACT_AMENDED` |
| **Invariants** | INV_SEC_04 (Hash chain preserved) |
| **Side Effects** | Both parties notified |

---

### CONTRACT_TERMINATE: Terminate Contract
**NOTE**: This command has TWO distinct flows based on initiator.

#### Variant A: Tenant Early Move-Out
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT (contract party) |
| **Preconditions** | - Contract exists<br>- User is the tenant<br>- `Contract.status = ACTIVE`<br>- Notice period ≥ 30 days |
| **Postconditions** | - `Contract.status = TERMINATED`<br>- `Contract.terminationType = EARLY_BY_TENANT`<br>- Early termination penalty calculated<br>- Refund amount calculated |
| **Events Emitted** | `CONTRACT_TERMINATED` |
| **Invariants** | INV_LIFE_02 (Notice period), INV_STATE_01 (Terminal state) |
| **Side Effects** | Room set to PENDING_HANDOVER |

#### Variant B: Landlord Eviction
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (contract party), ADMIN |
| **Preconditions** | - Contract exists<br>- User is the landlord<br>- `Contract.status = ACTIVE`<br>- Notice period ≥ 60 days<br>- Valid eviction reason (e.g., non-payment, violation) |
| **Postconditions** | - `Contract.status = TERMINATED`<br>- `Contract.terminationType = EARLY_BY_LANDLORD`<br>- Termination reason documented<br>- Refund amount calculated (full if no violations) |
| **Events Emitted** | `CONTRACT_TERMINATED` |
| **Invariants** | INV_LIFE_02 |
| **Side Effects** | Room set to PENDING_HANDOVER<br>Legal documentation generated |

---

### CONTRACT_RENEW: Renew Contract
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (contract party), TENANT (approval required) |
| **Preconditions** | - Contract exists<br>- `Contract.status = ACTIVE` or `EXPIRED`<br>- User is party to contract |
| **Postconditions** | - New contract created (DRAFT)<br>- `previousContractId` links to old contract<br>- Old contract status updated if ACTIVE |
| **Events Emitted** | `CONTRACT_RENEWED` |
| **Invariants** | None |
| **Side Effects** | Legal snapshot created for new contract |

---

## 5. PAYMENT COMMANDS

### PAY_CREATE: Create Payment
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT (payer), SYSTEM (automated) |
| **Preconditions** | - Invoice or Contract exists<br>- Idempotency key provided (required for user-initiated)<br>- User is the tenant (if user-initiated) |
| **Postconditions** | - Payment created with `status = PENDING`<br>- TransactionID generated |
| **Events Emitted** | `PAYMENT_CREATED` |
| **Invariants** | INV_FIN_04 (Idempotent creation), INV_SEC_03 (No duplicate transactionId) |
| **Side Effects** | External payment provider called |

---

### PAY_CONFIRM: Confirm Payment
| Attribute | Value |
|-----------|-------|
| **Actor** | SYSTEM (webhook from payment provider) |
| **Preconditions** | - Payment exists<br>- `Payment.status = PENDING`<br>- Valid webhook signature |
| **Postconditions** | - `Payment.status = COMPLETED`<br>- Associated invoice marked PAID |
| **Events Emitted** | `PAYMENT_COMPLETED` |
| **Invariants** | INV_STATE_01 (Terminal state), INV_FIN_03 (Paid invoice immutable) |
| **Side Effects** | Contract activation triggered (if deposit payment) |

---

### PAY_FAIL: Mark Payment as Failed
| Attribute | Value |
|-----------|-------|
| **Actor** | SYSTEM (webhook), ADMIN (manual intervention) |
| **Preconditions** | - Payment exists<br>- `Payment.status = PENDING` |
| **Postconditions** | - `Payment.status = FAILED`<br>- Failure reason recorded |
| **Events Emitted** | `PAYMENT_FAILED` |
| **Invariants** | None |
| **Side Effects** | User notified to retry |

---

## 6. BILLING COMMANDS

### BILL_GENERATE: Generate Invoice
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD, SYSTEM (automated monthly) |
| **Preconditions** | - Contract exists and `status = ACTIVE`<br>- User is landlord (if manual) |
| **Postconditions** | - Invoice created with `status = PENDING`<br>- Line items calculated |
| **Events Emitted** | `INVOICE_GENERATED` |
| **Invariants** | INV_FIN_01 (Decimal precision) |
| **Side Effects** | Notification sent to tenant |

---

### BILL_MARK_PAID: Mark Invoice as Paid
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (manual), SYSTEM (automated) |
| **Preconditions** | - Invoice exists<br>- `Invoice.status = PENDING` or `OVERDUE`<br>- Payment exists and `Payment.status = COMPLETED` (for system) |
| **Postconditions** | - `Invoice.status = PAID`<br>- `Invoice.paidAt` set<br>- Invoice frozen (immutable) |
| **Events Emitted** | `INVOICE_PAID` |
| **Invariants** | INV_FIN_03 (Paid invoice immutable), INV_FIN_04 (Idempotent) |
| **Side Effects** | Income record created |

---

### BILL_UPDATE: Update Invoice
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (invoice owner) |
| **Preconditions** | - Invoice exists<br>- `Invoice.status = PENDING` (NOT PAID)<br>- User is landlord |
| **Postconditions** | - Invoice updated<br>- Changes logged |
| **Events Emitted** | `INVOICE_UPDATED` |
| **Invariants** | INV_FIN_03 (Cannot update if PAID) |
| **Side Effects** | Tenant notified of changes |

---

## 7. MAINTENANCE COMMANDS

### MAINT_CREATE: Create Maintenance Request
| Attribute | Value |
|-----------|-------|
| **Actor** | TENANT (room occupant) |
| **Preconditions** | - User is TENANT<br>- Active contract exists for room<br>- User has < 3 active maintenance requests |
| **Postconditions** | - MaintenanceRequest created with `status = PENDING` |
| **Events Emitted** | `MAINTENANCE_REQUEST_CREATED` |
| **Invariants** | None |
| **Side Effects** | Landlord notified |

---

### MAINT_COMPLETE: Mark Maintenance as Completed
| Attribute | Value |
|-----------|-------|
| **Actor** | LANDLORD (property owner), ADMIN |
| **Preconditions** | - Request exists<br>- `MaintenanceRequest.status = IN_PROGRESS` |
| **Postconditions** | - `MaintenanceRequest.status = COMPLETED` (terminal) |
| **Events Emitted** | `MAINTENANCE_COMPLETED` |
| **Invariants** | INV_STATE_01 (Terminal state) |
| **Side Effects** | Tenant notified |

---

## 8. ADMIN COMMANDS

### ADMIN_DELETE_CONTRACT: Delete Contract (Soft Delete)
| Attribute | Value |
|-----------|-------|
| **Actor** | ADMIN |
| **Preconditions** | - Contract exists<br>- Valid deletion reason provided |
| **Postconditions** | - `Contract.deletedAt` set<br>- Admin action logged to AdminAuditLog |
| **Events Emitted** | `CONTRACT_DELETED` |
| **Invariants** | INV_LEGAL_03 (Admin action logged) |
| **Side Effects** | Immutable audit trail created |

---

### ADMIN_DELETE_INVOICE: Delete Invoice (Soft Delete)
| Attribute | Value |
|-----------|-------|
| **Actor** | ADMIN |
| **Preconditions** | - Invoice exists<br>- Valid deletion reason provided |
| **Postconditions** | - `Invoice.deletedAt` set<br>- Admin action logged |
| **Events Emitted** | `INVOICE_DELETED` |
| **Invariants** | INV_LEGAL_03 |
| **Side Effects** | Audit trail + suspicious pattern detection |

---

### ADMIN_OVERRIDE_PAYMENT: Manual Payment Override
| Attribute | Value |
|-----------|-------|
| **Actor** | ADMIN |
| **Preconditions** | - Payment exists<br>- Strong justification required |
| **Postconditions** | - Payment status changed<br>- Override reason logged |
| **Events Emitted** | `PAYMENT_OVERRIDDEN` |
| **Invariants** | INV_LEGAL_03 (Admin accountability) |
| **Side Effects** | Security alert triggered |

---

## Command vs Query Separation

### Commands (Mutate State)
All commands above MUST:
- Be wrapped in `@Post()`, `@Patch()`, `@Delete()` HTTP methods
- Append to EventStore
- Create legal snapshots where required
- Be idempotent where applicable

### Queries (Read-Only)
Queries (GET endpoints) MUST:
- NEVER modify state
- Use `@Get()` HTTP method
- NOT append to EventStore
- Be cacheable

---

## Enforcement Checklist

Before implementing a new command:
- [ ] Added to this table
- [ ] RBAC guard implemented
- [ ] Preconditions validated
- [ ] Events emitted
- [ ] Invariants checked
- [ ] Admin action logged (if admin command)
- [ ] Unit tests cover precondition failures

---

**Last Updated**: 2026-01-23  
**Owner**: System Architect  
**Sign-off Required**: Lead Engineer, Security Team
