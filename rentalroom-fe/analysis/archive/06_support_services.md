# Service Analysis: Support Services (Admin, Maintenance, Notifications, AI)

## 1. Executive Summary
-   **Admin**: Functional User Management (`UsersTable`).
-   **Maintenance**: Standard CRUD.
-   **Notifications**: Basic implementation.
-   **AI**: High-quality implementation with robust error handling.

## 2. Key Findings

### 🟢 [AI] Robust "Hybrid Search"
**Location**: `src/features/ai/api/semantic-search-api.ts`
**Observation**: The API client intelligently falls back: Semantic -> Hybrid -> Standard -> Empty. High reliability.
**Stats**: Caches popular searches for 10 minutes.

### 🟡 [Admin] Code Duplication
**Location**: `src/features/admin/components`
**Issue**: Many components reuse `useQuery` with inline `api.get` calls instead of centralized API hooks.
**Impact**: Hard to maintain if API endpoints change.

### 🟡 [Maintenance] "Legacy" Pages
**Location**: `src/features/maintenance`
**Issue**: Some directory structures imply legacy "pages" folders that might be unused in App Router.

## 3. Recommendations
1.  **Centralize Admin API**: Refactor `UsersTable` and others to use `api-extended.ts` or `admin-api.ts`.
2.  **Clean up Legacy**: Delete unused `pages` directories inside features if they are not used by the App Router.
