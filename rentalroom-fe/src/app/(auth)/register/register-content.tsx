'use client';

import dynamic from 'next/dynamic';

// Lazy-load client-only form to avoid SSR of framer-motion
const RegisterForm = dynamic(
  () => import('@/features/auth/components/register-form').then((m) => m.RegisterForm),
  { ssr: false },
);

export function RegisterContent() {
  return (
    <div className="container py-6">
      <RegisterForm />
    </div>
  );
}
