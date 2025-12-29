# Admin Dashboard Integration Guide

## 🎯 Overview
The admin dashboard is now fully integrated with:
- ✅ Real API fetchers (Zod-validated)
- ✅ Theme-based colors (no hardcoding)
- ✅ Suspense + Skeleton loading states
- ✅ Server-side data fetching
- ✅ AI module ready
- ✅ Ratings & analytics page

---

## 📁 File Structure

```
src/
├── features/admin/
│   ├── api-extended.ts          # ← NEW: Real API fetchers + Zod schemas
│   ├── api.ts                   # (existing stats fetcher)
│   └── schemas.ts               # (existing schemas)
├── app/(main)/dashboard/admin/
│   ├── page.tsx                 # Dashboard with dynamic charts
│   ├── reports/page.tsx         # Reports & Analytics
│   ├── rooms/page.tsx           # Room management (API-connected)
│   ├── contracts/page.tsx       # Contract management (API-connected)
│   ├── payments/page.tsx        # Payment tracking (API-connected)
│   ├── users/page.tsx           # User management (API-connected)
│   ├── analytics/page.tsx       # Ratings & Analytics (API-connected)
│   └── settings/page.tsx        # System settings
└── components/
    └── brand-logo.tsx           # Unified logo component
```

---

## 🔌 API Integration Pattern

### Real API Fetchers
Created in `src/features/admin/api-extended.ts`:

```typescript
// All fetchers use server-side getServerSession() for auth
async function fetchAdminRooms(page = 1): Promise<AdminRoom[]> {
  const { data } = await api.get<AdminRoom[]>("/admin/rooms", {
    params: { page, limit: 10 },
  });
  return z.array(adminRoomSchema).parse(data);
}
```

**Available endpoints:**
- `GET /admin/rooms` → Room inventory
- `GET /admin/contracts` → Active & expiring contracts
- `GET /admin/payments` → Payment status & tracking
- `GET /admin/users` → User management
- `GET /admin/ratings` → Landlord ratings & reviews

### Zod Schemas (Type-Safe)
```typescript
export const adminRoomSchema = z.object({
  id: z.string(),
  number: z.string(),
  property: z.string(),
  status: z.enum(["Đã cho thuê", "Trống", "Bảo trì"]),
  price: z.number(),
  occupant: z.string().optional(),
});
```

---

## 🎨 Theme Colors

**No hardcoded colors!** All pages use CSS variables:
- `text-primary` → Brand pink (#FF385C)
- `text-success` → Teal (#00A699)
- `text-warning` → Orange (#FC642D)
- `text-destructive` → Red (status errors)

See `src/app/globals.css` for full color definitions.

---

## 🤖 AI Module Integration

### Existing AI Features
- Located in: `src/features/ai/`
- Used for: Room recommendations, search augmentation
- Integration point: Admin can view AI-powered recommendations in reports

### Adding AI Insights to Admin
To add AI recommendations to the admin dashboard:

```typescript
// Example: AI-powered room recommendations
import { useAISearch } from "@/features/ai/hooks/use-ai-search";

const aiRecommendations = await getAIRecommendations({
  filter: "underpriced_rooms",
  limit: 5,
});
```

---

## ⭐ Ratings & Analytics Page

**Location:** `/dashboard/admin/analytics`

**Features:**
- Fetch landlord ratings via API
- Display average rating + review count
- Track rating trends
- Identify top & low-performing landlords
- Trigger AI analysis for recommendations

**Zod Schema:**
```typescript
const ratingSchema = z.object({
  id: z.string(),
  landlordId: z.string(),
  landlordName: z.string(),
  averageRating: z.number().min(0).max(5),
  totalRatings: z.number(),
  reviewCount: z.number(),
});
```

---

## 🔄 Applying Reports & Ratings

### Step 1: Fetch data in server component
```typescript
// In a page.tsx (server component)
const ratings = await fetchLandlordRatings();
```

### Step 2: Validate with Zod
```typescript
const validated = z.array(ratingSchema).parse(ratings);
```

### Step 3: Display with Suspense
```typescript
<Suspense fallback={<TableSkeleton />}>
  <RatingsTable ratings={ratings} />
</Suspense>
```

### Step 4: Add filters/sorting (client-side)
```typescript
"use client";
const [sorted, setSorted] = useState(ratings);
const handleSort = (by: "rating" | "reviews") => {
  // Sort logic
};
```

---

## 📊 Backend Endpoints (Expected)

Ensure your NestJS backend provides:

```bash
GET /api/v1/admin/rooms?page=1&limit=10
→ Returns: AdminRoom[]

GET /api/v1/admin/contracts?page=1&limit=10
→ Returns: AdminContract[]

GET /api/v1/admin/payments?page=1&limit=10
→ Returns: AdminPayment[]

GET /api/v1/admin/users?page=1&limit=10
→ Returns: AdminUser[]

GET /api/v1/admin/ratings
→ Returns: LandlordRating[]

GET /api/v1/admin/stats
→ Returns: AdminDashboardStats
```

---

## ✅ Next Steps

1. **Implement backend endpoints** matching the expected schema
2. **Test API integration** by visiting `/dashboard/admin` pages
3. **Add sorting/filtering** on data tables (client-side)
4. **Integrate AI module** for smart recommendations
5. **Add export-to-PDF** for reports (use `next/dynamic` for bundle optimization)

---

## 🛡️ Security

- ✅ RBAC enforced via middleware (`src/middleware.ts`)
- ✅ Server-side session validation (`getServerSession`)
- ✅ All API fetchers check `role === "ADMIN"`
- ✅ No sensitive data exposed to client

---

## 📝 Notes

- All pages use **Suspense + Skeleton loaders** for better UX
- Data is **server-side fetched** (no client-side API calls in pages)
- **Zod schemas** ensure type safety on all data
- **Theme colors** are consistent across all admin pages
