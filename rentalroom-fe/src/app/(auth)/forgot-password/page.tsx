import ForgotPasswordContent from './forgot-password-content';

// Disable static generation to prevent SSR issues with Framer Motion
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
