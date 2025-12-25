"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Maximize, Heart, MessageCircle } from "lucide-react";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@/types";
import { RoomStatus } from "@/types/enums";
import { ContactLandlordModal } from "@/features/contracts/components/contact-landlord-modal";

interface RoomCardProps {
  room: Room;
  onBookmark?: (roomId: string) => void;
  isBookmarked?: boolean;
}

export const RoomCard = memo(function RoomCard({ room, onBookmark, isBookmarked = false }: RoomCardProps) {
  // Find primary image or use first image, fallback to placeholder
  const mainImage = room.images?.find((img) => img.isPrimary)?.imageUrl ||
    room.images?.[0]?.imageUrl || "/placeholder-room.jpg";

  const isAvailable = room.status === RoomStatus.AVAILABLE;
  const { requireLogin, isLoggedIn } = useRequireAuth();
  const [localBookmarked, setLocalBookmarked] = useState<boolean>(isBookmarked);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleBookmark = () => {
    if (!isLoggedIn) {
      requireLogin(`/rooms/${room.id}`);
      return;
    }
    if (onBookmark) {
      onBookmark(room.id);
    }
    setLocalBookmarked((v) => !v);
  };

  const handleContactClick = () => {
    if (!isLoggedIn) {
      requireLogin(`/rooms/${room.id}`);
      return;
    }
    setContactModalOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full group hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 rounded-[20px]">
        {/* Image Container */}
        <div className="relative h-72 w-full overflow-hidden bg-muted">
          <Image
            src={mainImage}
            alt={`Room ${room.roomNumber}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={isAvailable ? "default" : "secondary"}>
              {room.status}
            </Badge>
          </div>
          {/* Disabled Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Không có sẵn</span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <CardContent className="flex flex-col flex-1 p-5 pb-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-xl line-clamp-1">
                Phòng {room.roomNumber}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                <MapPin className="size-4 flex-shrink-0" />
                <span className="line-clamp-1">{room.property?.name || "Chưa xác định"}</span>
              </p>
            </div>
            <div className="text-right ml-3">
              <p className="font-bold text-primary text-xl">
                {room.pricePerMonth.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-muted-foreground">/ tháng</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-6 my-4 text-sm">
            <div className="flex items-center gap-2">
              <Maximize className="size-5 flex-shrink-0 text-primary" />
              <span className="font-medium text-foreground">{room.area} m²</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-5 flex-shrink-0 text-primary" />
              <span className="font-medium text-foreground">Tối đa {room.maxOccupants || 1} người</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-4 flex gap-3">
            <Button
              asChild
              className="w-full font-semibold"
              variant="default"
              disabled={!isAvailable}
            >
              <Link href={`/rooms/${room.id}`}>Xem chi tiết</Link>
            </Button>
            <Button
              onClick={handleContactClick}
              variant="outline"
              size="icon"
              disabled={!isAvailable}
              title="Liên hệ chủ nhà"
              aria-label="Liên hệ chủ nhà"
            >
              <MessageCircle className="size-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Landlord Modal */}
      <ContactLandlordModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        roomId={room.id}
        roomName={`Phòng ${room.roomNumber}`}
        landlordName={room.property?.landlord?.user?.fullName || "Chủ nhà"}
      />
    </>
  );
});