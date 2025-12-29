# Maintenance UI - Tenant

This document describes the new Tenant Maintenance flow added to the frontend.

## New Page
- Route: `/dashboard/tenant/maintenance/new`
- Purpose: Allow a tenant to create a new maintenance request for a room.

## Component
- `src/features/maintenance/components/new-maintenance-form.tsx`
  - Fields: `roomId` (selectable from your active contracts / rooms or manual entry), `title`, `description`, `category`, `priority`, `requestDate`, `cost`.
  - Validation: `roomId`, `title`, `description`, `category` are required. The form will prefill room choices from the tenant's active contracts; if none found, a manual `roomId` input is shown.
  - Submits via `useCreateMaintenance` (react-query mutation) which calls `POST /api/v1/maintenance/requests`.
  - Requires authenticated tenant session (displays toast if not logged in).

## API
- New client helper: `src/features/maintenance/api/maintenance-api.ts`
  - `createRequest(dto)` → POST `/api/v1/maintenance/requests`

## How to test manually
1. Start FE + BE dev servers
2. Login as a tenant user
3. Visit `/dashboard/tenant/maintenance/new`
4. Fill the form and submit
5. Expect: success toast, and a maintenance request created in DB (check `maintenance_request` table)

## Next steps
- Add a tenant maintenance list page (`/dashboard/tenant/maintenance`) to browse requests
- Add tests (unit & e2e) when test infra is added to the repo
