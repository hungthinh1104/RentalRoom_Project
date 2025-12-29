"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DoorOpen, Search, MoreHorizontal, Eye, Settings, X } from "lucide-react";
import { useAdminRooms, useUpdateRoomStatus, type Room } from "@/features/admin/hooks/use-admin-properties";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Trống",
    className: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  },
  RENTED: {
    label: "Đã cho thuê",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  },
  MAINTENANCE: {
    label: "Bảo trì",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  },
};

export default function AdminRoomsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { data, isLoading } = useAdminRooms({ page, search, status: statusFilter });
  const updateStatus = useUpdateRoomStatus();

  const rooms = data?.items || [];
  const total = data?.total || 0;

  const handleSearchChange = (value: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
    setDebounceTimer(timer);
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ roomId, status: newStatus });
      toast.success("Đã cập nhật trạng thái phòng");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_MAP[status] || STATUS_MAP.AVAILABLE;
    return <Badge className={cn(config.className)}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `₫ ${(price / 1_000_000).toFixed(1)}M`;
    }
    return `₫ ${price.toLocaleString()}`;
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter(undefined);
  };

  const hasFilters = search || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý phòng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ phòng trên nền tảng ({total} phòng)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số phòng, tòa nhà..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="AVAILABLE">Trống</SelectItem>
                <SelectItem value="RENTED">Đã cho thuê</SelectItem>
                <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Danh sách phòng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy phòng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số phòng</TableHead>
                  <TableHead>Bất động sản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người thuê</TableHead>
                  <TableHead className="text-right">Giá tiền</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room: Room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{room.propertyName}</TableCell>
                    <TableCell>{getStatusBadge(room.status)}</TableCell>
                    <TableCell>
                      {room.tenantName || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(room.price)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Đổi trạng thái
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(room.id, "AVAILABLE")}>
                            Đánh dấu trống
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(room.id, "MAINTENANCE")}>
                            Đánh dấu bảo trì
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
