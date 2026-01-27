'use client';

import dynamic from 'next/dynamic';

// Lazy-load client-only form to avoid SSR of framer-motion
const LoginForm = dynamic(
  () => import('@/features/auth/components/login-form').then((m) => m.LoginForm),
  { ssr: false },
);

export function LoginContent() {
  return (
    <div className="container py-6">
      <LoginForm />
    </div>
  );
}
