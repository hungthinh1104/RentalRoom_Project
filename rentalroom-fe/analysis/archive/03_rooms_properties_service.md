# Service Analysis: Rooms & Properties

## 1. Executive Summary
This service manages the core inventory of the platform.
1.  **Public Rooms**: High-traffic search interface (`/rooms`) featuring AI-powered semantic search.
2.  **Property Management**: Landlord tools to create and manage buildings/units (`/dashboard/landlord/properties`).

- **Status**: High Quality / Feature Rich.
- **Highlights**: The **AI Search** implementation (`useAiSearch`) is sophisticated, with caching and fallback strategies.
- **Risks**: Some type casting (`as any`) in the public Room List suggests potential backend-frontend contract mismatches.

## 2. Architecture Overview

### Components
- **Public Search**: `src/app/(marketing)/rooms/page.tsx`
    - Uses `useAiSearch` hook -> `semanticSearchApi`.
- **Property Management**: `src/app/dashboard/landlord/properties`
    - Uses `PropertyWizard` (Dialog-based multi-step form) -> `propertiesApi`.

### Data Flow
- **Search**: Hybrid flow. Tries Semantic Search (Vector DB) -> Falls back to SQL Search if empty.
- **Creation**: `PropertyWizard` collects data in 3 steps (Info -> Location -> Images) before submitting to `POST /properties`.

## 3. Functional Verification

| Feature | Status | Implementation Details | User Story |
| :--- | :--- | :--- | :--- |
| **AI Search** | ✅ Excellent | Hybrid (Semantic + Keyword). Caches results for 5 mins. | "As a tenant, I can describe what I want ('room near university') and get results." |
| **Property List** | ✅ Functional | `PropertyGrid` with skeleton loading. | "As a landlord, I can see my assets." |
| **create Property**| ✅ Functional | `PropertyWizard` handles validation and image upload. | "As a landlord, I can add a new building easily." |
| **Room Details** | ❓ Pending | Need to verify individual Room Detail page (`/rooms/[id]`). | "As a tenant, I can view specifics of a room." |

## 4. Key Findings & Issues

### 🟢 [Feature] Robust AI Search
**Location**: `src/features/ai/hooks/use-ai-search.ts`
**Observation**: The hook implements a "Race" or "Waterfall" strategy: Semantic -> Hybrid -> Standard. This ensures users always get results.
**Note**: It aggressively caches (StaleTime: 5 mins). This is good for performance but might delay updates (e.g., if a room is booked immediately).

### 🟡 [Type Safety] Loose Casting in UI
**Location**: `src/app/(marketing)/rooms/page.tsx`
**Issue**: Uses `rooms as unknown as Room[]` and `<RoomList rooms={results as any} />`.
**Impact**: If the AI API returns a different shape (e.g., `score` field instead of `price`), the UI might crash or show `NaN`.
**Recommendation**: Define a shared `RoomSearchResult` type that covers both standard and AI responses.

### 🟡 [UX] Hardcoded Location Data
**Location**: `PropertyWizard.tsx` (Step 2)
**Issue**: City selection is hardcoded to 3 cities (HCM, Hanoi, Danang).
**Impact**: Limits platform growth. Should ideally fetch from an administrative API or config file.

## 5. Recommendations

1.  **Type Hardening**: Create a `UnifiedRoom` interface to remove `as any` casting in Search.
2.  **Config Extraction**: Move the list of Cities/Wards to `src/lib/constants/locations.ts` for easier maintenance.
3.  **Room Detail Check**: Inspect `src/app/(marketing)/rooms/[id]` (if it exists) in the next step to ensure the "View Detail" flow works.
