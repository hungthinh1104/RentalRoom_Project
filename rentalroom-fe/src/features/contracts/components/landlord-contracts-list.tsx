"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FileText,
	Search,
	CheckCircle2,
	XCircle,
	Clock,
	User,
	Home,
	Calendar,
	Banknote,
	AlertCircle
} from "lucide-react";
import { Contract, ContractStatus } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api/client";

export function LandlordContractsList() {
	const router = useRouter();
	const { data: session } = useSession();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");

	const { data: contracts, isLoading } = useQuery({
		queryKey: ["landlord-contracts", session?.user?.id],
		queryFn: async () => {
			const { data } = await api.get<Contract[] | { data: Contract[] }>("/contracts", {
				params: { landlordId: session?.user?.id },
			});
			// Handle both direct array response and wrapped response
			return Array.isArray(data) ? data : data?.data || [];
		},
		enabled: !!session?.user?.id,
	});

	const filteredContracts = useMemo(() => {
		return (contracts || []).filter((contract: Contract) => {
			const matchesSearch =
				searchQuery === "" ||
				contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === "ALL" || contract.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [contracts, searchQuery, statusFilter]);

	const getStatusBadge = (status: ContractStatus) => {
		const variants = {
			ACTIVE: { variant: "default" as const, icon: CheckCircle2, label: "Đang hoạt động" },
			TERMINATED: { variant: "destructive" as const, icon: XCircle, label: "Đã kết thúc" },
			EXPIRED: { variant: "secondary" as const, icon: Clock, label: "Hết hạn" },
			DRAFT: { variant: "outline" as const, icon: FileText, label: "Nháp" },
			PENDING_SIGNATURE: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ ký" },
			DEPOSIT_PENDING: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ cọc" },
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
					<h1 className="text-3xl font-bold">Hợp đồng thuê</h1>
					<p className="text-muted-foreground">
						Quản lý tất cả hợp đồng thuê phòng của bạn
					</p>
				</div>
				<Button onClick={() => router.push('/dashboard/landlord/contracts/create')}>
					Tạo hợp đồng mới
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Tìm theo mã hợp đồng..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContractStatus | "ALL")}>
					<TabsList>
						<TabsTrigger value="ALL">Tất cả</TabsTrigger>
						<TabsTrigger value="ACTIVE">Đang hoạt động</TabsTrigger>
						<TabsTrigger value="TERMINATED">Đã kết thúc</TabsTrigger>
						<TabsTrigger value="EXPIRED">Hết hạn</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Contracts Grid */}
			{filteredContracts.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Chưa có hợp đồng nào</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredContracts.map((contract: Contract) => (
						<Card key={contract.id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
										<p className="text-sm text-muted-foreground mt-1">
											{contract.room?.property?.name}
										</p>
									</div>
									{getStatusBadge(contract.status)}
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-2 text-sm">
									<User className="w-4 h-4 text-muted-foreground" />
									<span>{contract.tenant?.user?.fullName || "N/A"}</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Home className="w-4 h-4 text-muted-foreground" />
									<span>Phòng {contract.room?.roomNumber}</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<Calendar className="w-4 h-4 text-muted-foreground" />
									<span>
										{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })} -{" "}
										{format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}
									</span>
								</div>
								<div className="flex items-center gap-2 text-sm font-semibold">
									<Banknote className="w-4 h-4 text-muted-foreground" />
									<span>
										{new Intl.NumberFormat("vi-VN", {
											style: "currency",
											currency: "VND",
										}).format(Number(contract.monthlyRent))}
										/tháng
									</span>
								</div>
								<Button
									variant="outline"
									className="w-full mt-4"
									onClick={() => {
										router.push(`/dashboard/landlord/contracts/${contract.id}`);
									}}
								>
									Xem chi tiết
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}