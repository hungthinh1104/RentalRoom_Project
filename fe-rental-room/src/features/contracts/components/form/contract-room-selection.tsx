"use client";

import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import api from "@/lib/api/client";
import type { ContractInput } from "../../schemas";
import type { Room } from "@/types";

interface ContractRoomSelectionProps {
    form: UseFormReturn<ContractInput>;
}

export function ContractRoomSelection({ form }: ContractRoomSelectionProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    // Fetch Properties
    const { data: properties } = useQuery({
        queryKey: ["properties"],
        queryFn: async () => {
            const { data } = await api.get<{ data: any[] }>("/properties"); // Replace any with Property type if available
            return Array.isArray(data.data) ? data.data : [];
        },
    });

    // Fetch Rooms (filtered by property)
    const { data: rooms, isLoading } = useQuery({
        queryKey: ["available-rooms", selectedPropertyId],
        queryFn: async () => {
            const params: any = { status: "AVAILABLE" };
            if (selectedPropertyId && selectedPropertyId !== "all") {
                params.propertyId = selectedPropertyId;
            }
            const { data } = await api.get<{ data: Room[] }>("/rooms", { params });
            return Array.isArray(data.data) ? data.data : [];
        },
    });

    const selectedRoomId = form.watch("roomId");
    const selectedRoom = rooms?.find((r: Room) => r.id === selectedRoomId);

    // Auto-fill rent and deposit when room is selected
    useEffect(() => {
        if (selectedRoom) {
            if (!form.getValues("monthlyRent")) form.setValue("monthlyRent", selectedRoom.pricePerMonth);
            if (!form.getValues("deposit")) form.setValue("deposit", selectedRoom.deposit);
            if (!form.getValues("maxOccupants")) form.setValue("maxOccupants", selectedRoom.maxOccupants || 2);
            // Auto fill landlordId from property owner if available, or assume current user context handles it
            if (selectedRoom.property?.ownerId) form.setValue("landlordId", selectedRoom.property.ownerId);
        }
    }, [selectedRoom, form]);

    return (
        <div className="space-y-4">
            {/* Property Filter */}
            <div>
                <Label>Lọc theo nhà trọ</Label>
                <Select
                    value={selectedPropertyId}
                    onValueChange={(value) => {
                        setSelectedPropertyId(value);
                        form.setValue("roomId", ""); // Reset room selection
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả nhà trọ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả nhà trọ</SelectItem>
                        {properties?.map((property: any) => (
                            <SelectItem key={property.id} value={property.id}>
                                {property.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Room Selection */}
            <div>
                <Label htmlFor="roomId">Phòng</Label>
                {isLoading ? (
                    <div className="flex items-center gap-2 p-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải danh sách phòng...
                    </div>
                ) : (
                    <Select
                        value={selectedRoomId}
                        onValueChange={(value) => form.setValue("roomId", value)}
                    >
                        <SelectTrigger id="roomId">
                            <SelectValue placeholder="Chọn phòng" />
                        </SelectTrigger>
                        <SelectContent>
                            {rooms?.length === 0 ? (
                                <div className="p-2 text-center text-sm text-muted-foreground">
                                    Không có phòng trống
                                </div>
                            ) : (
                                rooms?.map((room: Room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                        <div className="flex items-center justify-between gap-2 w-full">
                                            <span>
                                                P.{room.roomNumber} - {room.property?.name}
                                            </span>
                                            <Badge variant="outline" className="ml-2">
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                    notation: "compact",
                                                }).format(room.pricePerMonth)}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                )}
                {form.formState.errors.roomId && (
                    <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.roomId.message}
                    </p>
                )}
            </div>

            {/* Room Details */}
            {selectedRoom && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold">Thông tin phòng</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Tòa nhà:</span>{" "}
                            <span className="font-medium">{selectedRoom.property?.name}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Địa chỉ:</span>{" "}
                            <span className="font-medium max-w-[200px] truncate block" title={selectedRoom.property?.address}>{selectedRoom.property?.address}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Số phòng:</span>{" "}
                            <span className="font-medium">{selectedRoom.roomNumber}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Diện tích:</span>{" "}
                            <span className="font-medium">{selectedRoom.area} m²</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Giá thuê:</span>{" "}
                            <span className="font-medium">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(selectedRoom.pricePerMonth)}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Tiền cọc:</span>{" "}
                            <span className="font-medium">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(selectedRoom.deposit)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
