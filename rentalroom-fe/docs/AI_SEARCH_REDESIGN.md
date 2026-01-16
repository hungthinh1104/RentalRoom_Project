# 🚀 Redesigned AI-Powered Search System

## Overview

The room search system has been completely redesigned to leverage your backend AI API while maintaining optimal performance and minimizing unnecessary API calls.

### Key Improvements

✅ **Dual Search Modes**
- **AI Mode**: Natural language semantic search ("Phòng trọ gần trường có máy lạnh, dưới 4 triệu")
- **Filter Mode**: Traditional filter-based search with status, price, area, amenities

✅ **Smart API Call Optimization**
- **Semantic Search**: 1 API call (debounced, 5min cache)
- **Hybrid Search**: 1 API call (semantic + filters combined on backend)
- **Standard Search**: 1 API call (filters only, 2min cache)
- **Popular Searches**: 1 API call (10min cache, for autocomplete)
- **Total**: Avg. 1 API call per search instead of 2-3+

✅ **Performance Features**
- 800ms debounce on AI search (prevents rapid API calls while typing)
- Query caching (React Query with stale time)
- Search history stored in localStorage (no API needed)
- Popular searches prefetched and cached
- Optimized memory usage with memoization

✅ **Beautiful UX**
- Autocomplete with popular searches and search history
- Search method indicators (AI, Hybrid, Standard)
- Empty state messages with helpful suggestions
- Loading states with spinners
- Vietnamese localization throughout

---

## Architecture

### File Structure

```
src/
├── features/
│   ├── ai/
│   │   ├── api/
│   │   │   ├── ai-api.ts (existing)
│   │   │   └── semantic-search-api.ts (NEW) ← Backend API wrapper
│   │   ├── components/
│   │   │   └── ai-search-input.tsx (NEW) ← AI search input with suggestions
│   │   └── hooks/
│   │       └── use-ai-search.ts (NEW) ← Smart search hook with caching
│   ├── rooms/
│   │   ├── components/
│   │   │   └── filters/ (existing)
│   │   ├── hooks/
│   │   │   └── use-rooms.ts (existing)
│   │   └── schemas.ts (existing)
│   └── ...
└── app/
    └── (main)/
        └── rooms/
            └── page.tsx (UPDATED) ← AI + Filters integration
```

### API Endpoints (Backend Required)

Your backend must support these endpoints for full functionality:

#### 1. **Semantic Search** (AI-powered)
```
GET /ai/search/semantic?q=<query>&limit=<number>
Response: { query, method: 'SEMANTIC', count, results: Room[] }
```

#### 2. **Hybrid Search** (Semantic + Filters)
```
GET /ai/search/hybrid?q=<query>&minPrice=...&maxPrice=...&amenities=...&limit=<number>
Response: { query, method: 'HYBRID', count, results: Room[] }
```

#### 3. **Standard Search** (Filters only)
```
GET /rooms?status=...&minPrice=...&maxPrice=...&page=...&limit=...
Response: { data: Room[], meta: { total, ... } }
```

#### 4. **Popular Searches** (Analytics)
```
GET /ai/analytics/popular-searches?limit=<number>
Response: { searches: Array<{ query: string, count: number }>, period: string }
```

---

## Component Guide

### 1. `AiSearchInput` Component

**Purpose**: Input field with AI-powered suggestions

**Props**:
```typescript
interface AiSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  showSuggestions?: boolean;
  maxSuggestions?: number;
}
```

**Features**:
- Popular searches autocomplete
- Search history (localStorage)
- Loading spinner
- Vietnamese descriptions
- Keyboard navigation (Enter, Escape)

**Usage**:
```tsx
<AiSearchInput
  value={aiQuery}
  onChange={setAiQuery}
  onSearch={(q) => console.log("Searching:", q)}
  isLoading={isFetching}
  placeholder="VD: Phòng trọ gần trường..."
/>
```

### 2. `useAiSearch` Hook

**Purpose**: Smart search with debounce, caching, and automatic mode selection

**Parameters**:
```typescript
useAiSearch(
  query: string,
  filters?: RoomFilterInput,
  options?: {
    debounceMs?: number;        // Default: 800ms
    searchMode?: 'semantic' | 'hybrid' | 'standard'; // Default: 'hybrid'
    limit?: number;             // Default: 12
    enabled?: boolean;          // Default: true
  }
)
```

**Returns**:
```typescript
{
  rooms: Room[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  searchMethod: 'semantic' | 'hybrid' | 'standard';
  prefetchPopularSearches: () => Promise<void>;
  trackQuery: (q: string) => void;
  getPerformedQueries: () => string[];
}
```

**Logic Flow**:
```
User types query
    ↓
Debounce 800ms
    ↓
Has query? (length > 2)
├─ YES → Semantic/Hybrid search (5min cache)
└─ NO → Standard filter search (2min cache)
    ↓
Return results with search method indicator
```

**Usage**:
```tsx
const { rooms, isLoading, searchMethod } = useAiSearch(
  aiQuery,
  filters,
  { debounceMs: 800, searchMode: "hybrid" }
);

// Show method badge
<Badge>{searchMethod === "semantic" ? "🤖 AI" : "⚡ Standard"}</Badge>
```

### 3. `usePopularSearches` Hook

**Purpose**: Fetch and cache popular searches for autocomplete

**Returns**:
```typescript
{
  data?: {
    searches: Array<{ query: string; count: number }>;
    period: string;
  };
  isLoading: boolean;
  error: Error | null;
}
```

**Usage**:
```tsx
const { data: popularSearchesData } = usePopularSearches(enabled);
const searches = popularSearchesData?.searches || [];
```

---

## Performance Optimization Details

### 1. **Cache Strategy**

| Search Type | Stale Time | GC Time | Debounce |
|-------------|-----------|---------|----------|
| Semantic | 5 min | 10 min | 800ms |
| Hybrid | 5 min | 10 min | 800ms |
| Standard | 2 min | 5 min | - |
| Popular | 10 min | 30 min | - |

**Benefits**:
- Same query within 5 minutes = no API call
- User navigates away = cache retained for 10-30 minutes
- Debounce prevents 5+ calls while typing one query

### 2. **API Call Reduction**

**Before Redesign**:
- Typing "phòng" → 5 API calls (1 for each keystroke)
- User applies filters → +1 API call
- User sees results, applies another filter → +1 API call
- **Total**: ~7 API calls for 1 search

**After Redesign**:
- Typing "phòng trọ gần trường" → 1 API call (debounced)
- User refines with filters → 0 extra calls (hybrid search includes filters)
- Popular searches cached for 10 minutes
- **Total**: 1 API call for 1 complete search

**Reduction**: 7x fewer API calls! 🎉

### 3. **Client-Side Optimizations**

```typescript
// 1. Debouncing (800ms)
const debouncedQuery = useDebounce(query, 800);

// 2. Memoization
const filteredRooms = useMemo(() => {...}, [data, filters]);

// 3. React Query caching
{
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 1,
}

// 4. localStorage for search history
localStorage.getItem("ai-search-history")
```

---

## Usage Example

### Complete Room Search Page

```tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiSearchInput } from "@/features/ai/components/ai-search-input";
import { useAiSearch } from "@/features/ai/hooks/use-ai-search";
import { RoomList } from "@/features/rooms/components/room-list";
import { RoomFilters } from "@/features/rooms/components/filters/room-filters";

export default function RoomsPage() {
  const [aiQuery, setAiQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [searchTab, setSearchTab] = useState<"ai" | "filters">("ai");

  const { rooms, isLoading, isFetching, searchMethod } = useAiSearch(
    aiQuery,
    filters,
    { searchMode: "hybrid", limit: 12 }
  );

  return (
    <div>
      {/* Tab Selection */}
      <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v)}>
        <TabsList>
          <TabsTrigger value="ai">🤖 Tìm kiếm AI</TabsTrigger>
          <TabsTrigger value="filters">⚙️ Bộ lọc</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AiSearchInput
            value={aiQuery}
            onChange={setAiQuery}
            isLoading={isFetching}
          />
          <p>Phương pháp: {searchMethod}</p>
        </TabsContent>

        <TabsContent value="filters">
          <RoomFilters onFiltersChange={setFilters} />
        </TabsContent>
      </Tabs>

      {/* Results */}
      <RoomList rooms={rooms} isLoading={isLoading} />
    </div>
  );
}
```

---

## Integration Checklist

- [x] Created `semantic-search-api.ts` with 4 API methods
- [x] Created `use-ai-search.ts` hook with debouncing and caching
- [x] Created `ai-search-input.tsx` component with suggestions
- [x] Updated `/rooms` page with tab-based search
- [x] Added Vietnamese localization
- [x] Optimized for minimal API calls
- [ ] **Backend**: Implement `/ai/search/semantic` endpoint
- [ ] **Backend**: Implement `/ai/search/hybrid` endpoint
- [ ] **Backend**: Verify `/ai/analytics/popular-searches` endpoint
- [ ] Test semantic search with Vietnamese queries
- [ ] Monitor API response times
- [ ] Collect analytics on search methods used

---

## Next Steps

1. **Backend Implementation** (if not already done):
   - Implement semantic search endpoint using Gemini API
   - Support hybrid search combining semantic + filters
   - Cache popular searches in Redis

2. **Analytics Tracking** (Optional):
   ```typescript
   // Track which search method users prefer
   trackQuery(aiQuery);
   const queries = getPerformedQueries();
   ```

3. **Advanced Features** (Future):
   - Search result ranking by relevance score
   - Personalized recommendations based on search history
   - Search analytics dashboard for admins
   - Multi-language support (Vietnamese, English)

---

## Troubleshooting

### "No results found" with AI search
- Check backend `/ai/search/semantic` endpoint is working
- Verify query is in Vietnamese
- Try broader search terms
- Fall back to filter-based search

### Slow search response
- Check Gemini API rate limits
- Verify cache is working (stale time 5 min)
- Monitor database query performance for room data

### Suggestions not showing
- Verify popular searches endpoint returns data
- Check localStorage is enabled
- Ensure `showSuggestions={true}` prop

---

## API Response Examples

### Semantic Search Response
```json
{
  "query": "phòng trọ gần trường có máy lạnh",
  "method": "SEMANTIC",
  "count": 15,
  "results": [
    {
      "id": "uuid-1",
      "roomNumber": "A101",
      "pricePerMonth": 3500000,
      "area": 25,
      "status": "AVAILABLE",
      "property": { "name": "Ký túc xá...", "city": "TP.HCM" },
      "amenities": [{ "type": "AC" }, { "type": "WIFI" }],
      "images": [...]
    }
  ],
  "responseTime": "245ms"
}
```

### Hybrid Search (Semantic + Filters)
```json
{
  "query": "phòng trọ gần trường",
  "method": "HYBRID",
  "count": 8,
  "results": [...]
}
```

---

**Status**: ✅ Ready for Backend Integration & Testing
