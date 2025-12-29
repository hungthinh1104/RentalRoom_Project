"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { RoomListLandlord } from "@/features/rooms/components/room-list-landlord";
import { RoomForm } from "@/features/rooms/components/room-form-landlord";
import { Room, Property } from "@/types";
import { RoomInput } from "@/features/rooms/schemas";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/dialogs/delete-confirmation-dialog";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast, showSuccess, showError } from "@/components/ui/toast-notification";

export default function PropertyRoomsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use API client to fetch from backend
        const propertyRes = await api.get<Property>(`/properties/${id}`);
        setProperty(propertyRes.data);

        // Fetch rooms using /rooms endpoint with propertyId filter
        const roomsRes = await api.get<{ data: Room[], meta: unknown }>(`/rooms`, {
          params: { propertyId: id }
        });
        setRooms(Array.isArray(roomsRes.data.data) ? roomsRes.data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        showError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [id, status]);

  const handleRoomSubmit = async (data: RoomInput) => {
    setLoading(true);
    try {
      const roomData = { ...data, propertyId: id };
      console.log('Sending room data:', roomData);

      if (editingRoom) {
        await api.patch(`/rooms/${editingRoom.id}`, roomData);
      } else {
        await api.post(`/rooms`, roomData);
      }

      showSuccess(editingRoom ? "Cập nhật phòng thành công!" : "Tạo phòng thành công!");
      setIsFormOpen(false);
      setEditingRoom(null);

      // Refetch rooms to get latest data
      const roomsRes = await api.get<{ data: Room[], meta: unknown }>(`/rooms`, {
        params: { propertyId: id }
      });
      console.log('Refetched rooms:', roomsRes.data.data);

      // Debug: Find and log the updated room
      if (editingRoom) {
        const updatedRoom = roomsRes.data.data.find((r: Room) => r.id === editingRoom.id);
        console.log('Updated room data:', updatedRoom);
        console.log('Updated room images:', updatedRoom?.images);
      }

      // Force re-render by creating new array
      setRooms([...(Array.isArray(roomsRes.data.data) ? roomsRes.data.data : [])]);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: { data: { message: string } } }).response;
        if (response?.data?.message?.includes("Unique constraint failed")) {
          showError("Số phòng này đã tồn tại trong bất động sản này.");
          return;
        }
      }
      showError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRoom) return;
    setIsDeleting(true);
    try {
      await api.delete(`/rooms/${deleteRoom.id}`);

      showSuccess("Xóa phòng thành công!");
      setRooms(rooms.filter((room) => room.id !== deleteRoom.id));
      setDeleteRoom(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container py-6 text-center">
        <p>Không tìm thấy bất động sản.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
      </Button>

      <RoomListLandlord
        rooms={rooms}
        propertyName={property.name}
        onEditRoom={(room) => {
          setEditingRoom(room);
          setIsFormOpen(true);
        }}
        onDeleteRoom={(room) => setDeleteRoom(room)}
        onAddRoom={() => setIsFormOpen(true)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</DialogTitle>
            <DialogDescription>
              {editingRoom ? "Cập nhật thông tin phòng" : "Điền thông tin để tạo phòng mới"}
            </DialogDescription>
          </DialogHeader>
          <RoomForm
            propertyId={id}
            defaultValues={editingRoom ? {
              roomNumber: editingRoom.roomNumber,
              area: editingRoom.area,
              pricePerMonth: editingRoom.pricePerMonth,
              deposit: editingRoom.deposit,
              maxOccupants: editingRoom.maxOccupants ?? undefined,
              status: editingRoom.status,
              description: editingRoom.description || "",
              amenities: editingRoom.amenities,
              images: editingRoom.images,
            } : undefined}
            onSubmit={handleRoomSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRoom(null);
            }}
            hideHeader={true}
            isEdit={!!editingRoom}
            propertyName={property.name}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={!!deleteRoom}
        onCancel={() => setDeleteRoom(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa phòng"
        description="Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
        itemName={deleteRoom?.roomNumber || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
