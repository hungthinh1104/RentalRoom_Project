import { Metadata } from "next";
import { LoginContent } from "./login-content";

export const metadata: Metadata = {
  title: "Login | Rental Room",
  description: "Login to your account",
};

export default function LoginPage() {
  return <LoginContent />;
}
