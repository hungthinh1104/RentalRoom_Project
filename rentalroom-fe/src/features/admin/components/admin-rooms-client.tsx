"use client";

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
import { DoorOpen, Search, MoreHorizontal, Eye, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminRoom } from "@/features/admin/schemas";

export default function AdminRoomsClient({ rooms: initialRooms }: { rooms: AdminRoom[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearch(value);
    }, 300);
    setDebounceTimer(timer);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Đã cho thuê":
        return {
          label: "Đã cho thuê",
          bgVar: "color-mix(in oklab, var(--info) 10%, transparent)",
          textVar: "var(--info)",
        };
      case "Trống":
        return {
          label: "Trống",
          bgVar: "color-mix(in oklab, var(--success) 10%, transparent)",
          textVar: "var(--success)",
        };
      case "Bảo trì":
        return {
          label: "Bảo trì",
          bgVar: "color-mix(in oklab, var(--warning) 10%, transparent)",
          textVar: "var(--warning)",
        };
      default:
        return {
          label: "Không xác định",
          bgVar: "color-mix(in oklab, var(--muted) 10%, transparent)",
          textVar: "var(--muted-foreground)",
        };
    }
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
  const total = initialRooms.length;

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
                <SelectItem value="Trống">Trống</SelectItem>
                <SelectItem value="Đã cho thuê">Đã cho thuê</SelectItem>
                <SelectItem value="Bảo trì">Bảo trì</SelectItem>
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
          {initialRooms.length === 0 ? (
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
                {initialRooms.map((room: AdminRoom) => {
                  const statusConfig = getStatusConfig(room.status);
                  return (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.number}</TableCell>
                      <TableCell className="text-muted-foreground">{room.property}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: statusConfig.bgVar,
                            color: statusConfig.textVar,
                            borderColor: `color-mix(in oklab, ${statusConfig.textVar} 30%, transparent)`,
                          }}
                          variant="outline"
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {room.occupant || <span className="text-muted-foreground">—</span>}
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
