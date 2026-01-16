"use client";

import { useState } from "react";
import { Room } from "@/types";
import { RoomStatus } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomCardLandlord } from "./room-card-landlord";
import {
  Plus,
  Search,
  Filter,
  DoorOpen,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoomListLandlordProps {
  rooms: Room[];
  propertyId?: string;
  propertyName: string;
  onAddRoom?: () => void;
  onEditRoom?: (room: Room) => void;
  onDeleteRoom?: (room: Room) => void;
  onViewRoom?: (room: Room) => void;
  isLoading?: boolean;
}

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "Trống",
  [RoomStatus.OCCUPIED]: "Đã thuê",
  [RoomStatus.UNAVAILABLE]: "Bảo trì",
  [RoomStatus.DEPOSIT_PENDING]: "Dự trữ",
};



export function RoomListLandlord({
  rooms,
  propertyName,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onViewRoom,
  isLoading,
}: RoomListLandlordProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === RoomStatus.AVAILABLE).length;
  const occupiedRooms = rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length;
  const avgPrice =
    rooms.length > 0
      ? Math.round(
        rooms.reduce((sum, r) => sum + r.pricePerMonth, 0) / rooms.length
      )
      : 0;

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <DoorOpen className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold">Quản lý phòng</h1>
            </div>
            <p className="text-muted-foreground">
              {propertyName} • {totalRooms} phòng
            </p>
          </div>
          {onAddRoom && (
            <Button
              onClick={onAddRoom}
              disabled={isLoading}
              className="gap-2 h-11"
            >
              <Plus className="w-4 h-4" />
              Thêm phòng
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Tổng phòng",
              value: totalRooms,
              icon: LayoutGrid,
              color: "primary",
            },
            {
              label: "Trống",
              value: availableRooms,
              icon: DoorOpen,
              color: "success",
            },
            {
              label: "Đã thuê",
              value: occupiedRooms,
              icon: DoorOpen,
              color: "info",
            },
            {
              label: "Giá TB",
              value:
                avgPrice > 0
                  ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    notation: "compact",
                    minimumFractionDigits: 0,
                  }).format(avgPrice)
                  : "N/A",
              icon: AlertCircle,
              color: "warning",
            },
          ].map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border/50">
                  <CardContent className="pt-4 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        `bg-${stat.color}/10 text-${stat.color}`
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-4 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Bộ lọc
                </CardTitle>
                {hasActiveFilters && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                    {searchQuery ? "1" : ""}{statusFilter !== "all" ? "1" : ""}
                  </div>
                )}
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                {showFilters ? "−" : "+"}
              </button>
            </div>
          </CardHeader>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-6 pb-4 border-t border-border/50 space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Tìm phòng</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo số phòng hoặc mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Trạng thái</label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as RoomStatus | "all")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {Object.entries(ROOM_STATUS_LABELS).map(([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      className="w-full"
                    >
                      Xóa lọc
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Rooms Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredRooms.map((room) => (
                <RoomCardLandlord
                  key={room.id}
                  room={room}
                  onEdit={onEditRoom}
                  onDelete={onDeleteRoom}
                  onView={onViewRoom}
                  isLoading={isLoading}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-64 rounded-lg border-2 border-dashed border-border/50 bg-muted/30"
          >
            <DoorOpen className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
            <h3 className="font-semibold text-lg mb-1">
              {searchQuery || statusFilter !== "all"
                ? "Không tìm thấy phòng"
                : "Chưa có phòng"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {searchQuery || statusFilter !== "all"
                ? "Hãy thử điều chỉnh bộ lọc"
                : "Tạo phòng đầu tiên cho bất động sản này"}
            </p>
            {!searchQuery && statusFilter === "all" && onAddRoom && (
              <Button
                onClick={onAddRoom}
                disabled={isLoading}
                className="mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm phòng đầu tiên
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
