import { fetchAdminPayments } from "@/features/admin/api-extended";
import AdminPaymentsClient from "@/features/admin/components/admin-payments-client";

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const payments = await fetchAdminPayments(1, 50);

  return <AdminPaymentsClient payments={payments} />;
}

