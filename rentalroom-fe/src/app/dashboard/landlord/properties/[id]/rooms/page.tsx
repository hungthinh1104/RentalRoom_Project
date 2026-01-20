"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { RoomManagementTable } from "@/features/rooms/components/RoomManagementTable";
import { AddRoomDialog } from "@/features/rooms/components/AddRoomDialog";
import { Property } from "@/features/properties/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyRoomsPage({ params }: PageProps) {
  const { id } = use(params);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  // Fetch minimal property details for header
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await api.get<Property>(`/properties/${id}`);
      return data;
    },
  });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!property) return <div className="p-8">Property not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/landlord/properties">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
            <span className="text-sm font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              {property.propertyType}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách phòng và trạng thái thuê.
          </p>
        </div>
        <Button onClick={() => setIsAddRoomOpen(true)} variant="premium">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phòng mới
        </Button>
      </div>

      {/* Main Content */}
      <RoomManagementTable propertyId={id} />

      {/* Modals */}
      <AddRoomDialog
        open={isAddRoomOpen}
        onOpenChange={setIsAddRoomOpen}
        propertyId={id}
      />
    </div>
  );
}
