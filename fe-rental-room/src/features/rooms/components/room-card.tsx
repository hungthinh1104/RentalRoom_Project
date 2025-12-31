"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Maximize, MessageCircle, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Room } from "@/types";
import { RoomStatus } from "@/types/enums";
import { ContactLandlordModal } from "@/features/contracts/components/contact-landlord-modal";
import { useFavorite } from "../hooks/use-favorite";
import { useToast } from '@/hooks/use-toast';

interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onView?: (room: Room) => void;
}

export const RoomCard = memo(function RoomCard({ room }: RoomCardProps) {
  // Use first image or fallback    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop";

  const isAvailable = room.status === RoomStatus.AVAILABLE;
  const { requireLogin, isLoggedIn } = useRequireAuth();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { isFavorite, toggle } = useFavorite(room.id);
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = (room.images?.length || 0) > 1;

  const handleContactClick = () => {
    if (!isLoggedIn) {
      requireLogin(`/rooms/${room.id}`);
      return;
    }
    setContactModalOpen(true);
  };

  const handleFavoriteClick = async () => {
    if (!isLoggedIn) {
      requireLogin(`/rooms/${room.id}`);
      return;
    }

    try {
      await toggle();
      toast({ title: isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích' });
    } catch {
      // useFavorite already handles toast on error
    }
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="">
      <Card className="overflow-hidden flex flex-col h-full group transition-transform duration-300 rounded-[28px] bg-card/80 backdrop-blur-xl shadow-xl p-0">
        {/* Image & Overlays Section - No padding */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-[28px]">
          {/* Carousel */}
          <Image
            src={room.images?.[currentImageIndex]?.imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"}
            alt={`Phòng ${room.roomNumber} - Ảnh ${currentImageIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />

          {/* Carousel Controls */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? (room.images?.length || 1) - 1 : prev - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === (room.images?.length || 1) - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                {room.images?.slice(0, 5).map((_img, idx) => (
                  <div
                    key={idx}
                    className={`size-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Favorite */}
          <div className="absolute top-3 left-3 z-30">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFavoriteClick(); }}
              className="p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
              aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart className={isFavorite ? 'text-destructive fill-destructive' : 'text-muted-foreground'} size={18} />
            </motion.button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-30">
            <Badge variant={isAvailable ? "default" : "secondary"} className="shadow-md backdrop-blur-md">
              {room.status}
            </Badge>
          </div>

          {/* Disabled Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white text-xs font-bold px-3 py-1.5 border border-white/50 rounded-full backdrop-blur-md bg-black/20">
                Hết phòng
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <CardContent className="flex flex-col flex-1 p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl line-clamp-1 tracking-tight">
                Phòng {room.roomNumber}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <MapPin className="size-4 flex-shrink-0 text-primary" />
                <span className="line-clamp-1">{room.property?.name || "Chưa xác định"}</span>
              </p>
            </div>
            <div className="text-right ml-3">
              <p className="font-bold text-primary text-xl tracking-tight">
                {room.pricePerMonth.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">/ tháng</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex gap-4 my-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-secondary">
              <Maximize className="size-4 text-primary" />
              <span className="text-xs font-semibold">{room.area} m²</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-secondary">
              <Users className="size-4 text-primary" />
              <span className="text-xs font-semibold">Tối đa {room.maxOccupants || 1}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-4 flex flex-col gap-3">
            <Button
              asChild
              className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20"
              disabled={!isAvailable}
            >
              <Link href={`/rooms/${room.id}`}>Xem chi tiết</Link>
            </Button>
            <Button
              onClick={handleContactClick}
              variant="outline"
              className="w-full font-bold h-11 rounded-xl hover:bg-secondary/80 transition-all"
              disabled={!isAvailable}
            >
              <MessageCircle className="size-5 mr-2" />
              Liên hệ chủ nhà
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
        landlordId={room.property?.landlord?.user?.id}
        landlordName={room.property?.landlord?.user?.fullName || "Chủ nhà"}
      />
    </motion.div>
  );
});