import { fetchAdminUsers } from "@/features/admin/api-extended";
import AdminUsersClient from "@/features/admin/components/admin-users-client";

export default async function UsersPage() {
  const users = await fetchAdminUsers(1, 50);

  return <AdminUsersClient users={users} />;
}
