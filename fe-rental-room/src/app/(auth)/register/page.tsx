import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register | Rental Room",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-page-gradient-from to-page-gradient-to">
      <RegisterForm />
    </div>
  );
}
