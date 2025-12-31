"use client";

import React, { use } from "react";
import { useProperty } from "@/features/properties/hooks/use-properties";
import { useRooms } from "@/features/rooms/hooks/use-rooms";
import { RoomList } from "@/features/rooms/components/room-list";
import { MapPin, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { PROPERTY_TYPE_LABELS } from "@/features/properties/constants";
import { PropertyType } from "@/types/enums";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);

	// Fetch Property Details
	const { data: property, isLoading: propertyLoading } = useProperty(id);

	// Fetch Rooms for this Property
	const { data: roomsData, isLoading: roomsLoading } = useRooms({
		propertyId: id,
		limit: 100, // Show all rooms for this property
	});

	const isLoading = propertyLoading || roomsLoading;

	if (isLoading) {
		return (
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				<div className="space-y-4">
					<Skeleton className="h-12 w-2/3" />
					<Skeleton className="h-6 w-1/3" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-[300px] rounded-[28px]" />
					))}
				</div>
			</div>
		);
	}

	if (!property) {
		return (
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-20 text-center">
				<h2 className="text-2xl font-bold">Không tìm thấy bất động sản</h2>
				<Button asChild className="mt-4" variant="outline">
					<Link href="/properties">Quay lại danh sách</Link>
				</Button>
			</div>
		);
	}

	const rooms = roomsData?.data || [];

	return (
		<div className="min-h-screen bg-muted/10 pb-20">
			{/* Property Header */}
			<div className="bg-background border-b border-border">
				<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
					<Button asChild variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
						<Link href="/properties" className="flex items-center gap-2">
							<ArrowLeft className="w-4 h-4" />
							Quay lại danh sách
						</Link>
					</Button>

					<div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<Badge variant="outline" className="px-3 py-1 text-sm font-semibold bg-primary/5 border-primary/20 text-primary">
									{PROPERTY_TYPE_LABELS[property.propertyType as PropertyType] || "Bất động sản"}
								</Badge>
								{property.totalRooms > 0 && (
									<span className="text-sm text-muted-foreground font-medium">
										{property.totalRooms} phòng
									</span>
								)}
							</div>

							<h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
								{property.name}
							</h1>

							<div className="flex items-center gap-2 text-muted-foreground text-lg">
								<MapPin className="w-5 h-5 text-primary" />
								<span>{property.address}, {property.ward}, {property.city}</span>
							</div>

							{property.description && (
								<p className="text-muted-foreground max-w-3xl leading-relaxed">
									{property.description}
								</p>
							)}
						</div>

						<div className="hidden md:block">
							<div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center min-w-[200px]">
								<Building2 className="w-8 h-8 text-primary mb-2" />
								<span className="text-sm font-bold text-primary">Quản lý bởi</span>
								<span className="font-semibold text-foreground mt-1 text-center">
									{property.landlord?.user?.fullName || "Chủ nhà"}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Rooms List Section */}
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-baseline gap-3">
						<h2 className="text-2xl font-bold text-foreground">Danh sách phòng</h2>
						<span className="text-lg text-muted-foreground font-medium">({rooms.length})</span>
					</div>
					<Button asChild variant="outline" className="gap-2">
						<Link href={`/properties/${id}/services`}>
							<Building2 className="w-4 h-4" />
							Quản lý dịch vụ
						</Link>
					</Button>
				</div>

				<RoomList rooms={rooms} isLoading={false} />
			</div>
		</div>
	);
}
