"use client";

import { Property } from "../types";
import { Card } from "@/components/ui/card";
import { MapPin, Home, Building2, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";

interface PropertyGridProps {
    properties: Property[];
    isLoading: boolean;
}

export function PropertyGrid({ properties, isLoading }: PropertyGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[300px] rounded-xl bg-card/50 animate-pulse border border-border/40" />
                ))}
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-border/40 rounded-xl bg-muted/5">
                <Building2 className="w-12 h-12 text-muted-foreground/50" />
                <div>
                    <h3 className="text-lg font-medium">Chưa có bất động sản nào</h3>
                    <p className="text-sm text-muted-foreground">Bắt đầu bằng cách thêm tòa nhà hoặc căn hộ đầu tiên của bạn.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
                <Card key={property.id} className="group overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    {/* Image Cover */}
                    <div className="relative h-48 w-full bg-muted/50 overflow-hidden">
                        {property.images && property.images.length > 0 ? (
                            <Image
                                src={property.images[0]}
                                alt={property.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                                <Building2 className="w-12 h-12 text-muted-foreground/20" />
                            </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white uppercase tracking-wider border border-white/10">
                            {property.propertyType}
                        </div>

                        {/* Quick Menu */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 border-none">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                    <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                                    <DropdownMenuItem>Quản lý phòng</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">Xóa</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                        <div>
                            <Link href={`/dashboard/landlord/properties/${property.id}`} className="block">
                                <h3 className="text-lg font-semibold tracking-tight hover:text-amber-500 transition-colors line-clamp-1">
                                    {property.name}
                                </h3>
                            </Link>
                            <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="line-clamp-1">{property.address}, {property.ward}, {property.city}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {/* Fake Avatars for "Occupants" concept */}
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-6 h-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground ml-1">
                                    {property.totalRooms || 0} phòng
                                </span>
                            </div>

                            <Button variant="ghost" size="sm" className="h-8 gap-1 hover:text-amber-500 group/btn" asChild>
                                <Link href={`/dashboard/landlord/properties/${property.id}`}>
                                    Chi tiết <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
