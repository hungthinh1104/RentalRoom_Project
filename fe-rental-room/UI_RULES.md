# UI Development Rules

## Design Principles

### 1. **Premium Aesthetics** (CRITICAL)
- Use vibrant, harmonious color palettes (HSL-based)
- Implement smooth gradients and transitions
- Add subtle micro-animations for interactions
- Modern typography (Google Fonts: Inter, Outfit, Roboto)
- Glassmorphism and depth effects where appropriate

### 2. **Responsive Design**
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Touch-friendly targets (min 44x44px)
- Fluid typography and spacing

### 3. **Component Structure**
```
components/
├── ui/              # Shadcn/ui components
├── features/        # Feature-specific components
└── layouts/         # Layout components
```

### 4. **Styling**
- **Primary**: Tailwind CSS
- **Avoid**: Inline styles unless dynamic
- **Colors**: Use CSS variables from `globals.css`
- **Dark Mode**: Support via `next-themes`

### 5. **State Management**
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand (if needed)
- **Forms**: React Hook Form + Zod

### 6. **Performance**
- Lazy load images with `next/image`
- Code splitting with dynamic imports
- Memoize expensive computations
- Virtualize long lists (react-window)

### 7. **Accessibility**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast ratio ≥ 4.5:1

## Code Standards

### TypeScript
```typescript
// ✅ Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

export function UserCard({ id, name, email }: UserProps) {
  return <div>...</div>;
}

// ❌ Bad
export function UserCard(props: any) {
  return <div>...</div>;
}
```

### Components
```typescript
// ✅ Good - Functional component with proper typing
export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }))}
      {...props}
    >
      {children}
    </button>
  );
}

// ❌ Bad - No types, inline styles
export function Button(props) {
  return <button style={{ color: 'blue' }}>{props.children}</button>;
}
```

### API Calls
```typescript
// ✅ Good - Use React Query
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  });
}

// ❌ Bad - Direct fetch in component
export function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
}
```

## File Naming

- Components: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-auth.ts`)
- Types: `types.ts` or `index.ts`

## Git Commit Messages

```
feat: Add user profile page
fix: Resolve login redirect issue
style: Update button hover effects
refactor: Simplify auth logic
docs: Update README
```

## Don'ts

❌ Don't use `any` type  
❌ Don't use inline styles (except dynamic values)  
❌ Don't fetch data in components (use React Query)  
❌ Don't create generic names (`Component1`, `temp`, `test`)  
❌ Don't skip accessibility features  
❌ Don't use plain colors (red, blue) - use design system  

## Do's

✅ Use TypeScript strictly  
✅ Use design system colors and spacing  
✅ Add loading and error states  
✅ Implement proper error handling  
✅ Write reusable components  
✅ Add hover/focus states  
✅ Optimize images and assets  
✅ Test on mobile devices  
