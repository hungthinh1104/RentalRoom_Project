"use client";

import { useRooms } from "../hooks/use-rooms";
import { Room, RoomStatus, AmenityType } from "../types";
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
import { MoreHorizontal, Power, Wifi } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface RoomManagementTableProps {
    propertyId: string;
}

export function RoomManagementTable({ propertyId }: RoomManagementTableProps) {
    const { rooms, isLoading, deleteRoom } = useRooms({ propertyId });

    const getStatusBadge = (status: RoomStatus) => {
        switch (status) {
            case RoomStatus.AVAILABLE: return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">Trống</Badge>;
            case RoomStatus.OCCUPIED: return <Badge className="bg-info/10 text-info hover:bg-info/20 border-info/20">Đang thuê</Badge>;
            case RoomStatus.DEPOSIT_PENDING: return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">Cọc giữ chỗ</Badge>;
            default: return <Badge variant="outline">Khác</Badge>;
        }
    };

    const handleDelete = async (id: string) => {
        toast.promise(deleteRoom(id), {
            loading: "Đang xóa phòng...",
            success: "Đã xóa phòng thành công",
            error: "Không thể xóa phòng, vui lòng thử lại",
        });
    };

    if (isLoading) {
        return <div className="p-10 text-center text-muted-foreground">Đang tải danh sách phòng...</div>;
    }

    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border/40 rounded-lg bg-muted/5">
                <p className="text-muted-foreground">Chưa có phòng nào trong danh sách.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead>Phòng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Giá thuê</TableHead>
                        <TableHead>Diện tích</TableHead>
                        <TableHead>Tiện nghi</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rooms.map((room: Room) => (
                        <TableRow key={room.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span className="text-base">{room.roomNumber}</span>
                                    <span className="text-xs text-muted-foreground">{room.maxOccupants} người</span>
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(room.status)}</TableCell>
                            <TableCell>{formatCurrency(room.pricePerMonth)}</TableCell>
                            <TableCell>{room.area} m²</TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    {room.amenities?.includes(AmenityType.WIFI) && <Wifi className="w-4 h-4 text-utility-internet" />}
                                    {room.amenities?.includes(AmenityType.AC) && <Power className="w-4 h-4 text-warning" />}
                                    <span className="text-xs text-muted-foreground self-center">
                                        {(room.amenities?.length ?? 0) > 2 ? `+${(room.amenities?.length ?? 0) - 2}` : ''}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                                        <DropdownMenuItem>Tạo hợp đồng</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(room.id)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
