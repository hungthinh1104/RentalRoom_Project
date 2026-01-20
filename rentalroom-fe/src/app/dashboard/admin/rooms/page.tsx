import { fetchAdminRooms } from "@/features/admin/api-extended";
import AdminRoomsClient from "@/features/admin/components/admin-rooms-client";

export default async function AdminRoomsPage() {
  const rooms = await fetchAdminRooms(1, 50);

  return <AdminRoomsClient rooms={rooms} />;
}
