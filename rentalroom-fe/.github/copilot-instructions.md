# GitHub Copilot Instructions - Rental Room Project

## Project Context
Commercial-grade rental room system (Airbnb/Agoda level). NOT a student project.

## ⚠️ CRITICAL: Documentation Rules

### When to Create .md Files
**ONLY create .md when explicitly requested by user with keywords:**
- "tạo document", "viết docs", "create documentation"
- "write README", "tạo hướng dẫn"

**NEVER auto-create .md files for:**
- Code changes (explain in comments instead)
- Feature implementations (use inline JSDoc)
- Bug fixes (use Git commit messages)
- Refactoring (comment in PR/code review)

### .md File Quality Standards
When creating .md (if explicitly requested):
1. **Be concise** - Max 100 lines unless complex system docs
2. **Use tables** over long paragraphs
3. **Code examples** over text explanations
4. **Bullet points** over sentences
5. **No redundant sections** (skip obvious info)
6. **Token efficiency** - Every word must add value

**Example - BAD (verbose):**
```md
# Button Component Documentation

## Introduction
This document explains how to use the Button component...

## Installation
First, you need to install the dependencies...
(200+ lines of obvious content)
```

**Example - GOOD (concise):**
```md
# Button Component
\`\`\`tsx
<Button variant="default|outline|ghost" size="sm|md|lg">
  Click me
</Button>
\`\`\`
Props: variant, size, disabled, asChild
```

## Mandatory Rules for ALL Code Generation

### 1. Component Structure
- Use Server Components by default (no "use client" unless interactive)
- Add "use client" ONLY for: forms, buttons with onClick, useState, useEffect
- Always import from `@/components/ui/*` and `@/lib/*`

### 2. Styling Requirements
```tsx
// ✅ ALWAYS use CSS variables from globals.css:
- Cards: rounded-[28px] with bg-card/80 backdrop-blur-xl
- Buttons: rounded-xl with text-primary-foreground bg-primary hover:bg-primary-hover
- Shadows: shadow-xl shadow-muted/30
- Colors: Use Tailwind classes that reference CSS variables:
  - Primary: text-primary, bg-primary, border-primary
  - Muted: text-muted-foreground, bg-muted
  - Success: text-success, bg-success
  - Destructive: text-destructive, bg-destructive
// ❌ NEVER hard-code colors like #5850EC or rgb(255, 56, 92)
```

### 3. Images (CRITICAL)
```tsx
// ❌ NEVER generate:
<img src={url} alt="..." />

// ✅ ALWAYS generate:
import Image from "next/image"
<Image src={url} alt="..." fill className="object-cover" sizes="..." />
```

### 4. Loading States
```tsx
// ❌ NEVER generate:
{isLoading && <Spinner />}

// ✅ ALWAYS generate:
import { Skeleton } from "@/components/ui/skeleton"
{isLoading ? <Skeleton className="h-48 w-full" /> : <Content />}
```

### 5. Animations (Framer Motion)
```tsx
// Always wrap pages with animation:
import { motion } from "framer-motion"

<motion.div 
  initial={{ opacity: 0, y: 20 }} 
  animate={{ opacity: 1, y: 0 }} 
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>

// For cards:
<motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
  <Card className="group hover:shadow-2xl">
    <Image className="group-hover:scale-105 transition-transform" />
  </Card>
</motion.div>

// For buttons:
<motion.button whileTap={{ scale: 0.98 }}>

// For favorite hearts:
<motion.button whileTap={{ scale: 1.2 }}>
  <Heart className={isFavorite ? "fill-red-500" : ""} />
</motion.button>
```

### 6. Search/Filter Inputs
```tsx
// Always use debounce for search:
import { useDebounce } from "@/hooks/use-debounce"

const [search, setSearch] = useState("")
const debouncedSearch = useDebounce(search, 300)

useEffect(() => {
  if (debouncedSearch) {
    searchAPI(debouncedSearch)
  }
}, [debouncedSearch])
```

### 7. Optimistic UI Pattern
```tsx
// For favorites, likes, etc:
const handleFavorite = async () => {
  setIsFavorite(!isFavorite) // Update immediately
  try {
    await api.toggle(id)
  } catch {
    setIsFavorite(!isFavorite) // Rollback if error
    toast.error("Action failed")
  }
}
```

### 8. Form Patterns
```tsx
// Always use react-hook-form + zod:
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Show loading in button:
<Button disabled={isPending}>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isPending ? "Processing..." : "Submit"}
</Button>

// Animate errors:
{error && (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
    <p className="text-destructive">{error}</p>
  </motion.div>
)}
```

### 9. Vietnamese Labels
All UI text must be in Vietnamese:
- "Đăng nhập" not "Login"
- "Tìm kiếm" not "Search"
- "Xem chi tiết" not "View Details"
- "Thêm vào yêu thích" not "Add to Favorites"

### 10. Responsive Design
```tsx
// Mobile-first approach:
<div className="
  grid grid-cols-1        // Mobile
  md:grid-cols-2         // Tablet
  lg:grid-cols-3         // Desktop
  gap-4 md:gap-6 lg:gap-8
">
```

## Component Templates

### Room Card (Perfect Example)
```tsx
"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { Heart, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RoomCard({ room }) {
  const [isFavorite, setIsFavorite] = useState(false)
  
  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card className="group overflow-hidden hover:shadow-2xl hover:shadow-slate-300/30 transition-all">
        <div className="relative h-48">
          <Image 
            src={room.image} 
            alt={room.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <motion.button 
            whileTap={{ scale: 1.2 }}
            className="absolute top-3 right-3 p-2 bg-card/80 backdrop-blur-md rounded-full hover:bg-card"
          >
            <Heart className={isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"} />
          </motion.button>
          <Badge className="absolute top-3 left-3 bg-success/90 backdrop-blur-md text-success-foreground">
            Còn trống
          </Badge>
        </div>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-lg text-card-foreground">{room.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{room.address}</span>
          </div>
          <p className="text-xl font-bold text-primary">{room.price.toLocaleString()}đ/tháng</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

### Page Layout
```tsx
import { motion } from "framer-motion"

export default async function RoomsPage() {
  const rooms = await getRooms() // Server fetch
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="container py-8"
    >
      <h1 className="text-3xl font-bold mb-6">Danh sách phòng trọ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => <RoomCard key={room.id} room={room} />)}
      </div>
    </motion.div>
  )
}
```

## Pre-Generation Checklist
Before generating ANY component, verify:
- [ ] Using next/image for images?
- [ ] Using Skeleton for loading states?
- [ ] Added Framer Motion animations?
- [ ] Glassmorphism effects on cards?
- [ ] Vietnamese labels?
- [ ] Optimistic UI for interactions?
- [ ] Debounce for search inputs?
- [ ] Mobile responsive grid?
- [ ] **NOT creating .md files unless explicitly requested?**

## Documentation Guidelines

### Code Documentation (Preferred Method)
Use **inline JSDoc** comments instead of separate .md files:

```tsx
/**
 * RoomCard Component
 * 
 * Displays room with image, price, location
 * Includes favorite toggle with optimistic UI
 * 
 * @example
 * <RoomCard room={roomData} onFavorite={handleFavorite} />
 * 
 * @param room - Room data object
 * @param onFavorite - Callback when favorite toggled
 */
export function RoomCard({ room, onFavorite }) {
  // Implementation
}
```

### When User Asks "Document This"
**Respond with code comments, NOT .md files:**

❌ **Don't create:** `COMPONENT_DOCUMENTATION.md`  
✅ **Do add:** JSDoc comments in the component file

### Summary Messages (Token Efficient)
When completing tasks, keep summaries ultra-concise:

❌ **Verbose (wastes tokens):**
```
I have successfully implemented the login feature. 
The implementation includes form validation, error handling, 
loading states, and follows the design system guidelines...
(10+ lines explaining obvious stuff)
```

✅ **Concise (efficient):**
```
✅ Login feature complete
- Form validation (Zod)
- Loading states (Skeleton)
- Error handling (motion animations)
- Follows design system
```

## Color Reference (from globals.css)
ALWAYS use these Tailwind classes (mapped to CSS variables):

**Brand Colors:**
- `text-primary` / `bg-primary` - Airbnb Rausch Pink (#FF385C)
- `hover:bg-primary-hover` - Darker pink (#E31C5F)
- `bg-primary-light` - Light pink backgrounds

**Status Colors:**
- `text-success` / `bg-success` - Teal (#00A699)
- `text-warning` / `bg-warning` - Orange (#FC642D)
- `text-destructive` / `bg-destructive` - Red (errors)

**Neutrals:**
- `text-foreground` - Almost black text
- `text-muted-foreground` - Secondary text
- `bg-muted` - Light gray backgrounds
- `bg-card` - Card backgrounds
- `border-border` / `border-input` - Borders

**Never hard-code:** #FF385C, rgb(255,56,92), hsl() - use CSS variables!

## Never Generate
- ❌ `.md` files (unless explicitly requested with "tạo docs", "create documentation")
- ❌ `<img>` tags (use next/image)
- ❌ Spinner components
- ❌ English UI labels
- ❌ Hard-coded hex colors (#5850EC, #FF385C)
- ❌ Sharp corners (use rounded-xl, rounded-[28px])
- ❌ Harsh black shadows (use shadow-muted/30)
- ❌ Search without debounce
- ❌ Forms without loading states
- ❌ Verbose summaries/explanations (be concise)

## Always Generate
- ✅ JSDoc comments for complex functions
- ✅ Inline code examples in comments
- ✅ Concise task summaries (< 5 lines)
- ✅ Vietnamese UI labels
- ✅ CSS variable classes (bg-primary, text-foreground)

## Performance Requirements
- All images lazy loaded with next/image
- Server Components for data fetching
- Client Components only for interactivity
- Debounced search (300ms)
- Optimistic UI updates

**Remember**: Every generated component must look and feel like Airbnb/Agoda, not a student project. Quality over speed!
