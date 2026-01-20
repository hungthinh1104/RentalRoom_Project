# Service Analysis: Tenants (Profiles & Management)

## 1. Executive Summary
The Tenant Service consists of two distinct parts:
1.  **Tenant Dashboard**: The user-facing view for tenants to manage their stay (`src/app/dashboard/tenant`).
2.  **Tenant Management**: The admin-facing view to manage users (`src/features/admin/components/UsersTable`).

- **Status**: Functional.
- **Critical Finding**: The main **Tenant Dashboard** is a Client Component that triggers 6+ simultaneous client-side requests, likely causing a generic loading experience. it should be optimized like the Finance page.

## 2. Architecture Overview

### Components
- **Tenant Scope**: `src/features/tenant` (lightweight, mostly hooks/api).
- **Admin Scope**: `src/features/admin` (heavy, contains table logic).
- **UI**: `src/app/dashboard/tenant/page.tsx` (Client Waterfall).

### Data Flow
- **Dashboard**: `useTenantDashboard` hook -> `dashboard-api.ts` -> Multiple `api.get` calls.
- **Admin**: `React Query` -> `api.get('/users')`.

## 3. Functional Verification

| Feature | Status | Implementation Details | User Story |
| :--- | :--- | :--- | :--- |
| **Tenant Dashboard** | ⚠️ Optimization Required | `page.tsx` ("use client") fetches Contracts, Payments, Favorites, etc. | "As a tenant, I see my room status and due payments immediately." |
| **User Listing** | ✅ Functional | `UsersTable.tsx` fetches users with pagination/search. | "As an admin, I can search and filter tenants." |
| **Ban/Unban** | ✅ Functional | `useMutation` calling `/users/{id}/ban`. | "As an admin, I can block abusive users." |
| **Profile** | ✅ Functional | `settings-profile-form.tsx` (assumed generic). | "As a user, I can update my info." |

## 4. Key Findings & Issues

### 🟡 [Performance] Dashboard Waterfall
**Location**: `src/app/dashboard/tenant/page.tsx`
**Issue**: This is a Client Component. On load, it waits for the JS bundle, then hydration, then fires 6 separate API requests via `useTenantDashboard`.
**Impact**: Slow Time-To-Interactive (TTI). Skeleton loading states are visible for too long.
**Fix**: Convert to **Server Component**. Fetch all summary data in `Promise.all` on the server (just like `FinancePage`) and pass to a `DashboardView` client component.

### 🟡 [Code Quality] Admin Fetching Duplication
**Location**: `src/features/admin/components/UsersTable.tsx`
**Issue**: Manually defines `queryFn` calling `api.get` directly, ignoring the typed helper `fetchAdminUsersClient` in `admin/api.ts`.
**Impact**: Inconsistent error handling; duplicate code.

### 🟢 [Type Safety] Loose Casting
**Location**: `dashboard-api.ts`
**Issue**: Uses `unknown` casting in `getOpenMaintenance` (`item as { status?: string }`).
**Impact**: Functional but risky if backend API changes shape.

## 5. Recommendations

1.  **Refactor Dashboard**: Convert `TenantDashboardPage` to use Server-Side Data Fetching. This will significantly improve the "first paint" impression.
2.  **Standardize Admin**: Update `UsersTable` to use `fetchAdminUsersClient`.
3.  **Strict Types**: Define proper interfaces for Maintenance and Booking responses in `dashboard-api.ts`.
