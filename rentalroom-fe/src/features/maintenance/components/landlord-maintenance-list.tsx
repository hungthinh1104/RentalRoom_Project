"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Wrench,
	Search,
	AlertCircle,
	CheckCircle2,
	Clock,
	XCircle,
	User,
	Home,
} from "lucide-react";
import { MaintenanceRequest } from "@/types";
import { MaintenanceStatus, MaintenancePriority } from "@/types/enums";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api/client";
import { toast } from "sonner";

export function LandlordMaintenanceList() {
	const { data: session } = useSession();
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "ALL">("ALL");

	const { data: requests, isLoading } = useQuery({
		queryKey: ["landlord-maintenance", session?.user?.id],
		queryFn: async () => {
			const { data } = await api.get<MaintenanceRequest[] | { data: MaintenanceRequest[] }>("/maintenance/requests", {
				params: { landlordId: session?.user?.id },
			});
			// Handle both direct array response and wrapped response
			return Array.isArray(data) ? data : data?.data || [];
		},
		enabled: !!session?.user?.id,
	});

	const updateStatusMutation = useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: MaintenanceStatus;
		}) => {
			const { data } = await api.patch(`/maintenance/requests/${id}`, { status });
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["landlord-maintenance"] });
			toast.success("Cập nhật trạng thái thành công");
		},
		onError: () => {
			toast.error("Không thể cập nhật trạng thái");
		},
	});

	const filteredRequests = (requests || []).filter((request: MaintenanceRequest) => {
		const matchesSearch =
			searchQuery === "" ||
			request.tenant?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			request.description?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const getStatusBadge = (status: MaintenanceStatus) => {
		const variants = {
			PENDING: { variant: "secondary" as const, icon: Clock, label: "Chờ xử lý" },
			IN_PROGRESS: { variant: "default" as const, icon: AlertCircle, label: "Đang xử lý" },
			COMPLETED: { variant: "default" as const, icon: CheckCircle2, label: "Hoàn thành" },
			CANCELLED: { variant: "destructive" as const, icon: XCircle, label: "Đã hủy" },
		};
		const config = variants[status];
		const Icon = config.icon;
		return (
			<Badge variant={config.variant} className="gap-1">
				<Icon className="w-3 h-3" />
				{config.label}
			</Badge>
		);
	};

	const getPriorityBadge = (priority: MaintenancePriority) => {
		const variants = {
			LOW: { variant: "secondary" as const, label: "Thấp" },
			MEDIUM: { variant: "default" as const, label: "Trung bình" },
			HIGH: { variant: "destructive" as const, label: "Cao" },
			URGENT: { variant: "destructive" as const, label: "Khẩn cấp" },
		};
		const config = variants[priority];
		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-64" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Yêu cầu bảo trì</h1>
					<p className="text-muted-foreground">Quản lý các yêu cầu sửa chữa từ khách thuê</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Tìm theo tên khách thuê hoặc mô tả..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as MaintenanceStatus | "ALL")}>
					<TabsList>
						<TabsTrigger value="ALL">Tất cả</TabsTrigger>
						<TabsTrigger value="PENDING">Chờ xử lý</TabsTrigger>
						<TabsTrigger value="IN_PROGRESS">Đang xử lý</TabsTrigger>
						<TabsTrigger value="COMPLETED">Hoàn thành</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Requests Grid */}
			{filteredRequests.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Wrench className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Chưa có yêu cầu bảo trì nào</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredRequests.map((request: MaintenanceRequest) => (
						<Card key={request.id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											{getStatusBadge(request.status)}
											{getPriorityBadge(request.priority)}
										</div>
										<p className="text-sm text-muted-foreground">
											{format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", {
												locale: vi,
											})}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-2 text-sm">
									<User className="w-4 h-4 text-muted-foreground" />
									<span>{request.tenant?.user?.fullName || "N/A"}</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Home className="w-4 h-4 text-muted-foreground" />
									<span>Phòng {request.room?.roomNumber}</span>
								</div>
								<div className="text-sm">
									<p className="font-medium mb-1">Mô tả:</p>
									<p className="text-muted-foreground line-clamp-2">{request.description}</p>
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col gap-2 pt-2">
									{request.status === "PENDING" && (
										<Button
											size="sm"
											onClick={() =>
												updateStatusMutation.mutate({
													id: request.id,
													status: "IN_PROGRESS",
												})
											}
											disabled={updateStatusMutation.isPending}
										>
											Bắt đầu xử lý
										</Button>
									)}
									{request.status === "IN_PROGRESS" && (
										<Button
											size="sm"
											variant="default"
											onClick={() =>
												updateStatusMutation.mutate({
													id: request.id,
													status: "COMPLETED",
												})
											}
											disabled={updateStatusMutation.isPending}
										>
											Đánh dấu hoàn thành
										</Button>
									)}
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											window.location.href = `/dashboard/landlord/maintenance/${request.id}`;
										}}
									>
										Xem chi tiết
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}