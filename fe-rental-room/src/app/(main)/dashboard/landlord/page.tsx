import { redirect } from "next/navigation";

export default function LandlordIndex() {
  redirect("/dashboard/landlord/overview");
}
