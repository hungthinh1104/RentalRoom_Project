"use client";

import { memo } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoomStatus } from "@/types/enums";
import {
  Zap,
  Users,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  DoorOpen,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StarRating } from "@/components/ui/star-rating";
import { Room, RoomAmenity } from "@/types";

interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  onView?: (room: Room) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [RoomStatus.AVAILABLE]: {
    label: "Trống",
    color: "bg-success/10 text-success border-success/20",
    icon: <DoorOpen className="w-3 h-3" />,
  },
  [RoomStatus.OCCUPIED]: {
    label: "Đã thuê",
    color: "bg-info/10 text-info border-info/20",
    icon: <Users className="w-3 h-3" />,
  },
  [RoomStatus.UNAVAILABLE]: {
    label: "Bảo trì",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  [RoomStatus.DEPOSIT_PENDING]: {
    label: "Đặt trước",
    color: "bg-secondary/10 text-secondary border-secondary/20",
    icon: <Zap className="w-3 h-3" />,
  },
};

export const RoomCardLandlord = memo(function RoomCardLandlord({
  room,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: RoomCardProps) {
  const statusConfig = STATUS_CONFIG[room.status];
  const priceFormatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(room.pricePerMonth);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col group border-2 hover:border-primary/50">
        {/* Header */}
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                  Phòng {room.roomNumber}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 line-clamp-1">
                  {room.description || "Không có mô tả"}
                </CardDescription>
                {/* Rating Display */}
                {room.reviewCount !== undefined && room.reviewCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating rating={room.averageRating || 0} size="sm" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {room.averageRating?.toFixed(1)} ({room.reviewCount})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium uppercase border",
                statusConfig.color
              )}
            >
              {statusConfig.icon} {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 pt-4 space-y-5">
          {/* Price & Deposit */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium uppercase">Giá thuê/tháng</p>
              <p className="text-lg font-bold text-primary">{priceFormatted}</p>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="space-y-0.5 text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase">Tiền cọc</p>
              <p className="text-sm font-bold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                }).format(room.deposit)}
              </p>
            </div>
          </div>

          {/* Room Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Area */}
            <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg p-3 flex items-center gap-3 border">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase">Diện tích</p>
                <p className="text-sm font-bold">{room.area} m²</p>
              </div>
            </div>

            {/* Max Occupants */}
            <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-lg p-3 flex items-center gap-3 border">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase">Tối đa</p>
                <p className="text-sm font-bold">
                  {room.maxOccupants || "Tùy ý"}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {room.amenities.filter(Boolean).slice(0, 3).map((amenity, index) => {
                const amenityLabel = typeof amenity === 'object' && amenity !== null
                  ? (amenity as RoomAmenity).amenityType
                  : amenity;
                const amenityKey = typeof amenity === 'object' && amenity !== null
                  ? (amenity as RoomAmenity).id || index
                  : `${amenity}-${index}`;

                return (
                  <Badge key={amenityKey} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                    {amenityLabel}
                  </Badge>
                );
              })}
              {room.amenities.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                  +{room.amenities.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t bg-muted/20 flex gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(room)}
              disabled={isLoading}
              className="flex-1 gap-1.5 text-xs h-9"
            >
              <Eye className="w-3.5 h-3.5" />
              Chi tiết
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(room)}
              disabled={isLoading}
              className="flex-1 gap-1.5 text-xs h-9"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Chỉnh sửa
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(room)}
              disabled={isLoading}
              className="flex-1 gap-1.5 text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
