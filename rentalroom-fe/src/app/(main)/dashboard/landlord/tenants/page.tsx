"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Search,
	User,
	Phone,
	Mail,
	MapPin,
	FileText,
	Calendar,
	Building2,
	CheckCircle2,
	Clock,
	XCircle,
	AlertCircle
} from "lucide-react";
import { Contract, ContractStatus } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api/client";

interface TenantWithContracts {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	contracts: Contract[];
}

export default function LandlordTenantsPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [searchQuery, setSearchQuery] = useState("");

	const { data: contracts, isLoading } = useQuery({
		queryKey: ["landlord-contracts", session?.user?.id],
		queryFn: async () => {
			const { data } = await api.get<Contract[] | { data: Contract[] }>("/contracts", {
				params: { landlordId: session?.user?.id },
			});
			return Array.isArray(data) ? data : data?.data || [];
		},
		enabled: !!session?.user?.id,
	});

	// Group contracts by tenant
	const tenants = useMemo(() => {
		if (!contracts) return [];

		const tenantMap = new Map<string, TenantWithContracts>();

		contracts.forEach((contract: Contract) => {
			const tenantUserId = contract.tenant?.userId || contract.tenant?.id;
			const tenantUser = contract.tenant?.user;

			if (!tenantUserId || !tenantUser) return;

			if (!tenantMap.has(tenantUserId)) {
				tenantMap.set(tenantUserId, {
					id: tenantUserId,
					fullName: tenantUser.fullName || "N/A",
					email: tenantUser.email || "N/A",
					phone: tenantUser.phoneNumber || "N/A",
					contracts: [],
				});
			}

			tenantMap.get(tenantUserId)!.contracts.push(contract);
		});

		return Array.from(tenantMap.values());
	}, [contracts]);

	const filteredTenants = useMemo(() => {
		return tenants.filter((tenant) => {
			const searchLower = searchQuery.toLowerCase();
			return (
				searchQuery === "" ||
				tenant.fullName.toLowerCase().includes(searchLower) ||
				tenant.email.toLowerCase().includes(searchLower) ||
				tenant.phone.includes(searchQuery)
			);
		});
	}, [tenants, searchQuery]);

	const getStatusBadge = (status: ContractStatus) => {
		const variants = {
			ACTIVE: { variant: "default" as const, icon: CheckCircle2, label: "Đang hoạt động" },
			TERMINATED: { variant: "destructive" as const, icon: XCircle, label: "Đã kết thúc" },
			EXPIRED: { variant: "secondary" as const, icon: Clock, label: "Hết hạn" },
			DRAFT: { variant: "outline" as const, icon: FileText, label: "Nháp" },
			PENDING_SIGNATURE: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ ký" },
			DEPOSIT_PENDING: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ đặt cọc" },
		};

		const config = variants[status as keyof typeof variants] || variants.DRAFT;
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
			<div className="container py-8 max-w-7xl space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-5 w-96" />
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-48 w-full rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="container py-8 max-w-7xl space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Quản lý người thuê</h1>
				<p className="text-muted-foreground mt-2">
					Danh sách tất cả người thuê và hợp đồng của họ
				</p>
			</div>

			{/* Search */}
			<div className="flex gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Tìm theo tên, email, số điện thoại..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Tenants List */}
			{filteredTenants.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<User className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							{searchQuery ? "Không tìm thấy người thuê nào" : "Chưa có người thuê nào"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredTenants.map((tenant) => {
						const activeContracts = tenant.contracts.filter(
							(c) => c.status === ContractStatus.ACTIVE
						);

						return (
							<Card
								key={tenant.id}
								className="hover:shadow-lg transition-all duration-200 cursor-pointer"
								onClick={() => router.push(`/dashboard/landlord/tenants/${tenant.id}`)}
							>
								<CardHeader>
									<div className="flex items-start gap-4">
										<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
											<User className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<CardTitle className="text-lg truncate">{tenant.fullName}</CardTitle>
											<p className="text-sm text-muted-foreground mt-1">
												{activeContracts.length > 0
													? `${activeContracts.length} hợp đồng đang hoạt động`
													: "Không có hợp đồng hoạt động"}
											</p>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									{/* Contact Info */}
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm">
											<Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
											<span className="truncate">{tenant.email}</span>
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
											<span>{tenant.phone}</span>
										</div>
									</div>

									{/* Contracts Summary */}
									<div className="pt-3 border-t space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Tổng hợp đồng</span>
											<Badge variant="outline">{tenant.contracts.length}</Badge>
										</div>

										{activeContracts.length > 0 && (
											<div className="space-y-2">
												{activeContracts.slice(0, 2).map((contract) => (
													<div
														key={contract.id}
														className="p-2 bg-muted/50 rounded-lg space-y-1"
													>
														<div className="flex items-center justify-between">
															<span className="text-xs font-medium">
																{contract.contractNumber}
															</span>
															{getStatusBadge(contract.status)}
														</div>
														<div className="flex items-center gap-1 text-xs text-muted-foreground">
															<Building2 className="w-3 h-3" />
															<span className="truncate">
																{contract.room?.property?.name} - Phòng{" "}
																{contract.room?.roomNumber}
															</span>
														</div>
														<div className="flex items-center gap-1 text-xs text-muted-foreground">
															<Calendar className="w-3 h-3" />
															<span>
																{format(new Date(contract.startDate), "dd/MM/yyyy", {
																	locale: vi,
																})}{" "}
																-{" "}
																{format(new Date(contract.endDate), "dd/MM/yyyy", {
																	locale: vi,
																})}
															</span>
														</div>
													</div>
												))}
												{activeContracts.length > 2 && (
													<p className="text-xs text-center text-muted-foreground">
														+{activeContracts.length - 2} hợp đồng khác
													</p>
												)}
											</div>
										)}
									</div>

									{/* View Details Button */}
									<Button variant="outline" className="w-full mt-4" size="sm">
										<FileText className="w-4 h-4 mr-2" />
										Xem chi tiết
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
