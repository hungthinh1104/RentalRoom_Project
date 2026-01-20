import { fetchAdminContracts } from "@/features/admin/api-extended";
import AdminContractsClient from "@/features/admin/components/admin-contracts-client";

export const dynamic = 'force-dynamic';

export default async function AdminContractsPage() {
  const contracts = await fetchAdminContracts(1, 50);

  return <AdminContractsClient contracts={contracts} />;
}

