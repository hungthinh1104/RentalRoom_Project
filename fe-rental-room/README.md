# Rental Room - Frontend

Commercial-grade rental room platform (Next.js 16 + React 19)

## Quick Start

```bash
npm install
npm run dev  # http://localhost:3000
```

## Stack

| Tech | Version | Usage |
|------|---------|-------|
| Next.js | 16.0.5 | App Router, Turbopack |
| React | 19.2.0 | UI framework |
| Tailwind CSS | v4 | Styling (CSS-first config) |
| Framer Motion | 12.x | Animations |
| React Query | 5.x | Data fetching |
| NextAuth | 4.24 | Authentication |
| Zod | 4.x | Validation |

## Features

- ✅ Auth (login, register, verify email)
- ✅ Airbnb-inspired design system
- ✅ Glassmorphism UI
- ✅ Dark mode support
- ✅ Responsive layout
- 🚧 Property listings (in progress)
- 🚧 Booking system (planned)

## Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # Shared components
│   ├── ui/          # shadcn/ui components
│   └── shared/      # Custom components
├── features/        # Feature modules
│   └── auth/        # Auth feature (refactored)
├── hooks/           # Custom hooks
└── lib/             # Utilities
```

## Documentation

- [API Reference](./docs/API_FOR_FRONTEND.md) - Backend API endpoints
- [Design System](./docs/DESIGN_SYSTEM_RULES.md) - UI guidelines
- [Auth Feature](./src/features/auth/README.md) - Auth implementation
- [AI Instructions](./.github/copilot-instructions.md) - Copilot rules

## Color System

Primary: `#FF385C` (Airbnb Pink)  
Use CSS variables: `bg-primary`, `text-muted-foreground`, etc.

## Dev Notes

- Tailwind v4 uses `@theme inline` in `globals.css` (no `tailwind.config.js`)
- All images use `next/image` (no `<img>` tags)
- Loading states use `Skeleton` (no spinners)
- Animations < 0.3s duration
- Vietnamese UI labels required
