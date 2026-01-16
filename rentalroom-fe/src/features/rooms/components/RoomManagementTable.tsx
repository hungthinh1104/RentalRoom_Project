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
            case RoomStatus.AVAILABLE: return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Trống</Badge>;
            case RoomStatus.OCCUPIED: return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Đang thuê</Badge>;
            case RoomStatus.DEPOSIT_PENDING: return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Cọc giữ chỗ</Badge>;
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
                                    {room.amenities?.includes(AmenityType.WIFI) && <Wifi className="w-4 h-4 text-blue-500" />}
                                    {room.amenities?.includes(AmenityType.AC) && <Power className="w-4 h-4 text-orange-500" />}
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
