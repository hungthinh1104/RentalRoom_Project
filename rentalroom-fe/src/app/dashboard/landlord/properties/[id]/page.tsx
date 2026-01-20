"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { propertiesApi } from "@/features/properties/api/properties-api";
import { roomsApi } from "@/features/rooms/api/rooms-api";
import type { Property, Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Edit,
	Trash2,
	MapPin,
	Building2,
	Bed,
	DollarSign,
	Users,
	Calendar,
	Home,
	Plus,
	ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const [property, setProperty] = useState<Property | null>(null);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [propertyId, setPropertyId] = useState<string>("");
	const router = useRouter();

	useEffect(() => {
		params.then(({ id }) => {
			setPropertyId(id);
			fetchPropertyData(id);
		});
	}, [params]);

	const fetchPropertyData = async (id: string) => {
		setIsLoading(true);
		try {
			const [propertyData, roomsData] = await Promise.all([
				propertiesApi.getById(id),
				roomsApi.getAll({ propertyId: id }),
			]);
			setProperty(propertyData);
			setRooms(roomsData.data || []);
		} catch (error) {
			console.error("Failed to fetch property:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!propertyId || !confirm("Bạn có chắc chắn muốn xóa bất động sản này?")) return;
		try {
			await propertiesApi.delete(propertyId);
			router.push("/dashboard/landlord/properties");
		} catch (error) {
			console.error("Failed to delete property:", error);
			alert("Không thể xóa bất động sản. Vui lòng thử lại.");
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-12 w-64" />
				<Skeleton className="h-96 w-full rounded-3xl" />
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Skeleton className="h-32 rounded-2xl" />
					<Skeleton className="h-32 rounded-2xl" />
					<Skeleton className="h-32 rounded-2xl" />
				</div>
			</div>
		);
	}

	if (!property) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh] gap-4">
				<Building2 className="h-16 w-16 text-muted-foreground" />
				<h2 className="text-2xl font-bold">Không tìm thấy bất động sản</h2>
				<Button onClick={() => router.push("/dashboard/landlord/properties")}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Quay lại danh sách
				</Button>
			</div>
		);
	}

	const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
	const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-8 p-6 max-w-7xl mx-auto"
		>
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push("/dashboard/landlord/properties")}
						className="rounded-full"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-black tracking-tight">{property.name}</h1>
						<div className="flex items-center gap-2 mt-1 text-muted-foreground">
							<MapPin className="h-4 w-4" />
							<span className="text-sm">
								{property.address}, {property.ward}, {property.district}, {property.city}
							</span>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => router.push(`/dashboard/landlord/properties/${propertyId}/edit`)}
						className="gap-2"
					>
						<Edit className="h-4 w-4" />
						Chỉnh sửa
					</Button>
					<Button variant="destructive" onClick={handleDelete} className="gap-2">
						<Trash2 className="h-4 w-4" />
						Xóa
					</Button>
				</div>
			</div>

			{/* Image Gallery */}
			<div className="relative h-96 rounded-3xl overflow-hidden border bg-muted">
				{property.images && property.images.length > 0 ? (
					<Image
						src={property.images[0]}
						alt={property.name}
						fill
						className="object-cover"
						priority
					/>
				) : (
					<div className="flex items-center justify-center h-full">
						<Building2 className="h-24 w-24 text-muted-foreground/30" />
					</div>
				)}
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<StatCard
					icon={<Home className="h-6 w-6" />}
					label="Loại hình"
					value={property.propertyType || "N/A"}
					gradient="from-blue-500 to-cyan-500"
				/>
				<StatCard
					icon={<Bed className="h-6 w-6" />}
					label="Tổng số phòng"
					value={rooms.length.toString()}
					gradient="from-purple-500 to-pink-500"
				/>
				<StatCard
					icon={<Users className="h-6 w-6" />}
					label="Phòng trống"
					value={availableRooms.toString()}
					gradient="from-green-500 to-emerald-500"
				/>
				<StatCard
					icon={<DollarSign className="h-6 w-6" />}
					label="Đã cho thuê"
					value={occupiedRooms.toString()}
					gradient="from-amber-500 to-orange-500"
				/>
			</div>

			{/* Description */}
			{property.description && (
				<div className="rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
					<h3 className="text-lg font-bold mb-3">Mô tả</h3>
					<p className="text-muted-foreground leading-relaxed">{property.description}</p>
				</div>
			)}

			{/* Rooms Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-2xl font-bold">Danh sách phòng ({rooms.length})</h3>
					<Button
						onClick={() => router.push(`/dashboard/landlord/properties/${propertyId}/rooms`)}
						className="gap-2 bg-primary"
					>
						<Plus className="h-4 w-4" />
						Quản lý phòng
					</Button>
				</div>

				{rooms.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 border rounded-2xl bg-muted/30">
						<Bed className="h-12 w-12 text-muted-foreground mb-3" />
						<p className="text-muted-foreground">Chưa có phòng nào</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{rooms.map((room) => (
							<RoomCard key={room.id} room={room} propertyId={propertyId} />
						))}
					</div>
				)}
			</div>
		</motion.div>
	);
}

function StatCard({
	icon,
	label,
	value,
	gradient,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	gradient: string;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
			<div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-[3rem]`} />
			<div className="relative z-10">
				<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
					{icon}
				</div>
				<p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
				<p className="text-2xl font-black">{value}</p>
			</div>
		</div>
	);
}

function RoomCard({ room, propertyId }: { room: Room; propertyId: string }) {
	const statusColors = {
		AVAILABLE: "bg-green-500/10 text-green-600 border-green-500/20",
		OCCUPIED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
		MAINTENANCE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	};

	const statusLabels = {
		AVAILABLE: "Trống",
		OCCUPIED: "Đã thuê",
		MAINTENANCE: "Bảo trì",
	};

	return (
		<Link
			href={`/dashboard/landlord/properties/${propertyId}/rooms`}
			className="group relative overflow-hidden rounded-2xl border bg-card/50 p-5 hover:shadow-lg transition-all hover:border-primary/50"
		>
			<div className="flex items-start justify-between mb-3">
				<div>
					<h4 className="font-bold text-lg group-hover:text-primary transition-colors">
						Phòng {room.roomNumber}
					</h4>
					<p className="text-sm text-muted-foreground">#{room.roomNumber}</p>
				</div>
				<Badge className={cn("border", statusColors[room.status as keyof typeof statusColors])}>
					{statusLabels[room.status as keyof typeof statusLabels] || room.status}
				</Badge>
			</div>

			<div className="space-y-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Diện tích</span>
					<span className="font-semibold">{room.area || "N/A"} m²</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Giá thuê</span>
					<span className="font-bold text-primary">
						{room.pricePerMonth?.toLocaleString("vi-VN")} ₫/tháng
					</span>
				</div>
			</div>

			<div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-3">
				<ExternalLink className="h-4 w-4 text-primary" />
			</div>
		</Link>
	);
}
