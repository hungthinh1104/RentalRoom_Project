# Auth Feature - Refactored Structure

## 📁 Folder Structure

```
/src/features/auth/
├── api/
│   ├── auth-api.ts          ✅ API client methods
│   └── auth-queries.ts       ✅ React Query keys factory
├── components/
│   ├── login-form.tsx        ✅ Login with motion animations
│   ├── register-form.tsx     ✅ Registration with role selection
│   ├── verify-email-form.tsx ✅ Email verification with countdown
│   └── logout-button.tsx     ✅ Logout with loading state
├── hooks/
│   ├── use-login.ts          ✅ Login mutation hook
│   ├── use-register.ts       ✅ Register, verify, resend hooks
│   ├── use-session.ts        ✅ Session & logout hooks
│   └── use-auth.ts           ✅ Barrel export (re-exports all hooks)
├── schemas.ts                ✅ Zod validation schemas
├── types.ts                  ✅ TypeScript type definitions
└── index.ts                  ✅ Public API barrel export
```

## ✨ Key Improvements

### Before Refactoring
❌ **Problem 1: God File**
- `use-auth.ts` contained ALL 5 hooks in one file (47 lines)
- Hard to find specific hooks
- Poor separation of concerns

❌ **Problem 2: Empty Files**
- 6 empty files cluttering the structure
- Confusing for new developers
- Abandoned refactoring attempt

### After Refactoring
✅ **Solution 1: One Hook Per File**
- `use-login.ts` - Login mutation only
- `use-register.ts` - Register + verify + resend
- `use-session.ts` - Session + logout
- `use-auth.ts` - Barrel export for convenience

✅ **Solution 2: Complete Implementation**
- All files now have content and purpose
- Clear documentation with JSDoc
- Example usage in each hook

✅ **Solution 3: Better Organization**
- Query keys in dedicated file
- Type definitions separated
- Enhanced validation schemas

## 🎯 Usage Examples

### Login Flow
```tsx
import { useLogin, LoginForm } from '@/features/auth'

function LoginPage() {
  return <LoginForm />
}

// Or custom implementation
function CustomLogin() {
  const { mutate: login, isPending, error } = useLogin()
  
  const handleLogin = (credentials) => {
    login(credentials, {
      onSuccess: () => router.push('/dashboard')
    })
  }
}
```

### Register Flow
```tsx
import { useRegister, RegisterForm } from '@/features/auth'

function RegisterPage() {
  return <RegisterForm />
}

// Or custom
function CustomRegister() {
  const { mutate: register, isPending } = useRegister()
  
  register(userData, {
    onSuccess: () => {
      toast.success("Đăng ký thành công!")
      router.push('/verify-email?email=' + userData.email)
    }
  })
}
```

### Email Verification
```tsx
import { VerifyEmailForm } from '@/features/auth'

function VerifyEmailPage() {
  return <VerifyEmailForm />
}
```

### Logout
```tsx
import { LogoutButton } from '@/features/auth'

function Header() {
  return (
    <LogoutButton 
      variant="ghost"
      onLogoutSuccess={() => toast.success("Đã đăng xuất")}
    />
  )
}
```

### Session Management
```tsx
import { useSession } from '@/features/auth'

function ProfileMenu() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <Skeleton />
  if (status === "unauthenticated") return <LoginButton />
  
  return (
    <div>
      <p>Welcome, {session.user.fullName}</p>
      <Badge>{session.user.role}</Badge>
    </div>
  )
}
```

## 🔑 Query Keys

```tsx
import { authKeys, authMutations } from '@/features/auth'

// Get current user
const { data: user } = useQuery({
  queryKey: authKeys.currentUser(),
  queryFn: () => authApi.getCurrentUser()
})

// Invalidate on logout
queryClient.invalidateQueries({ 
  queryKey: authKeys.currentUser() 
})

// Clear all auth data
queryClient.removeQueries({ 
  queryKey: authKeys.all 
})
```

## 📝 Validation Schemas

All schemas follow Vietnamese error messages:

- `loginSchema` - Email + password
- `registerSchema` - Full registration with role
- `verifyEmailSchema` - 6-digit code
- `resendVerificationSchema` - Email only
- `forgotPasswordSchema` - Email only
- `resetPasswordSchema` - Password + confirm

## 🎨 Design System Compliance

All components follow the Airbnb-inspired design:
- ✅ Glassmorphism: `bg-card/80 backdrop-blur-xl`
- ✅ Rounded corners: `rounded-xl`
- ✅ Motion animations: < 0.3s duration
- ✅ Loading states: NO spinners, use Loader2 icon
- ✅ Shadows: `shadow-xl shadow-muted/30`
- ✅ Colors: CSS variables (no hard-coded colors)

## 🔄 Migration Guide

### For existing code using old imports:

**Before:**
```tsx
import { useLogin } from '@/features/auth/hooks/use-auth'
```

**After (still works):**
```tsx
import { useLogin } from '@/features/auth/hooks/use-auth'
```

**Better (recommended):**
```tsx
import { useLogin } from '@/features/auth'
```

## 🚀 Next Steps

Apply this pattern to other features:
1. `/features/properties` - Property listings
2. `/features/rooms` - Room management
3. `/features/contracts` - Contract management
4. `/features/payments` - Payment processing
5. `/features/maintenance` - Maintenance requests

## 📚 File Responsibilities

### API Layer (`api/`)
- `auth-api.ts` - HTTP client methods (axios/fetch)
- `auth-queries.ts` - React Query key factories

### Component Layer (`components/`)
- Form components with validation
- Motion animations and glassmorphism
- Vietnamese labels and error messages

### Hook Layer (`hooks/`)
- One hook per file (except related hooks)
- React Query mutations with cache updates
- Error handling with meta.errorMessage

### Schema Layer (`schemas.ts`)
- Zod validation schemas
- Type inference exports
- Vietnamese validation messages

### Type Layer (`types.ts`)
- Feature-specific TypeScript types
- Constants (ROLE_DASHBOARD_ROUTES)
- Enums (AuthErrorCode)

### Public API (`index.ts`)
- Barrel export for clean imports
- Documentation with examples
- Version control friendly

---

**Refactored by:** GitHub Copilot  
**Date:** 2024  
**Pattern:** One hook per file, clear separation of concerns  
**Status:** ✅ Complete, 0 errors
