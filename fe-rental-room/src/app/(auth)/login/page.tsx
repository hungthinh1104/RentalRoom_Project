import { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login | Rental Room",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-6">Đang tải…</div>}>
      <LoginForm />
    </Suspense>
  );
}
