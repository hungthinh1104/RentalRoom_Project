import { Metadata } from "next";
import { RegisterContent } from "./register-content";

export const metadata: Metadata = {
  title: "Register | Rental Room",
  description: "Create a new account",
};

export default function RegisterPage() {
  return <RegisterContent />;
}
