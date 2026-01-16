import { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Register | Rental Room",
  description: "Create a new account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
