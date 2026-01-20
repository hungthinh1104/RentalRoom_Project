"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowLeft,
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
	AlertCircle,
	Banknote,
	Eye
} from "lucide-react";
import { Contract, ContractStatus } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api/client";

export default function TenantDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const tenantId = params.id as string;

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

	// Filter contracts for this specific tenant
	const tenantContracts = contracts?.filter(
		(contract: Contract) => contract.tenant?.userId === tenantId || contract.tenant?.id === tenantId
	) || [];

	const tenant = tenantContracts[0]?.tenant;
	const tenantUser = tenant?.user;

	const activeContracts = tenantContracts.filter((c: Contract) => c.status === ContractStatus.ACTIVE);
	const expiredContracts = tenantContracts.filter((c: Contract) => c.status === ContractStatus.EXPIRED);
	const terminatedContracts = tenantContracts.filter((c: Contract) => c.status === ContractStatus.TERMINATED);

	const getStatusBadge = (status: ContractStatus) => {
		const variants = {
			ACTIVE: { variant: "default" as const, icon: CheckCircle2, label: "Đang hoạt động", className: "bg-green-500" },
			TERMINATED: { variant: "destructive" as const, icon: XCircle, label: "Đã kết thúc", className: "bg-red-500" },
			EXPIRED: { variant: "secondary" as const, icon: Clock, label: "Hết hạn", className: "bg-yellow-500" },
			DRAFT: { variant: "outline" as const, icon: FileText, label: "Nháp", className: "bg-gray-500" },
			PENDING_SIGNATURE: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ ký", className: "bg-blue-500" },
			DEPOSIT_PENDING: { variant: "secondary" as const, icon: AlertCircle, label: "Chờ đặt cọc", className: "bg-orange-500" },
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
				<Skeleton className="h-10 w-full" />
				<div className="grid gap-6 md:grid-cols-3">
					<Skeleton className="h-48" />
					<Skeleton className="h-48" />
					<Skeleton className="h-48" />
				</div>
				<Skeleton className="h-96" />
			</div>
		);
	}

	if (!tenant || !tenantUser) {
		return (
			<div className="container py-8 max-w-7xl">
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<User className="w-12 h-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold">Không tìm thấy người thuê</h3>
						<p className="text-sm text-muted-foreground mt-2">
							Người thuê này không tồn tại hoặc bạn không có quyền xem.
						</p>
						<Button onClick={() => router.push("/dashboard/landlord/tenants")} className="mt-4">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Quay lại danh sách
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container py-8 max-w-7xl space-y-8">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/landlord/tenants")}>
					<ArrowLeft className="w-5 h-5" />
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">{tenantUser.fullName}</h1>
					<p className="text-muted-foreground mt-1">Thông tin chi tiết người thuê</p>
				</div>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-6 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Hợp đồng hoạt động</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{activeContracts.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Tổng hợp đồng</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{tenantContracts.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
						{activeContracts.length > 0 ? (
							<CheckCircle2 className="h-4 w-4 text-green-500" />
						) : (
							<XCircle className="h-4 w-4 text-red-500" />
						)}
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{activeContracts.length > 0 ? "Đang thuê" : "Không hoạt động"}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tenant Information */}
			<Card>
				<CardHeader>
					<CardTitle>Thông tin cá nhân</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Họ và tên</p>
								<p className="font-medium">{tenantUser.fullName}</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<Mail className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="font-medium">{tenantUser.email}</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<Phone className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Số điện thoại</p>
								<p className="font-medium">{tenantUser.phoneNumber || "N/A"}</p>
							</div>
						</div>

						{tenant.emergencyContact && (
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
									<Phone className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Liên hệ khẩn cấp</p>
									<p className="font-medium">{tenant.emergencyContact}</p>
								</div>
							</div>
						)}

						{tenant.address && (
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
									<MapPin className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Địa chỉ</p>
									<p className="font-medium">{tenant.address}</p>
								</div>
							</div>
						)}

						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
								<Calendar className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Ngày tham gia</p>
								<p className="font-medium">
									{tenant.createdAt ? format(new Date(tenant.createdAt), "dd/MM/yyyy", { locale: vi }) : "N/A"}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Contracts */}
			<Card>
				<CardHeader>
					<CardTitle>Hợp đồng</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="active" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="active">Đang hoạt động ({activeContracts.length})</TabsTrigger>
							<TabsTrigger value="expired">Hết hạn ({expiredContracts.length})</TabsTrigger>
							<TabsTrigger value="terminated">Đã kết thúc ({terminatedContracts.length})</TabsTrigger>
						</TabsList>

						<TabsContent value="active" className="space-y-4 mt-4">
							{activeContracts.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									Không có hợp đồng đang hoạt động
								</div>
							) : (
								activeContracts.map((contract: Contract) => (
									<ContractCard key={contract.id} contract={contract} getStatusBadge={getStatusBadge} router={router} />
								))
							)}
						</TabsContent>

						<TabsContent value="expired" className="space-y-4 mt-4">
							{expiredContracts.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">Không có hợp đồng hết hạn</div>
							) : (
								expiredContracts.map((contract: Contract) => (
									<ContractCard key={contract.id} contract={contract} getStatusBadge={getStatusBadge} router={router} />
								))
							)}
						</TabsContent>

						<TabsContent value="terminated" className="space-y-4 mt-4">
							{terminatedContracts.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									Không có hợp đồng đã kết thúc
								</div>
							) : (
								terminatedContracts.map((contract: Contract) => (
									<ContractCard key={contract.id} contract={contract} getStatusBadge={getStatusBadge} router={router} />
								))
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

function ContractCard({
	contract,
	getStatusBadge,
	router,
}: {
	contract: Contract;
	getStatusBadge: (status: ContractStatus) => React.ReactElement;
	router: ReturnType<typeof useRouter>;
}) {
	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className="space-y-3 flex-1">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
							{getStatusBadge(contract.status)}
						</div>

						<div className="grid gap-2 md:grid-cols-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Building2 className="w-4 h-4" />
								<span>
									{contract.room?.property?.name} - Phòng {contract.room?.roomNumber}
								</span>
							</div>

							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="w-4 h-4" />
								<span>
									{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })} -{" "}
									{format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}
								</span>
							</div>

							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Banknote className="w-4 h-4" />
								<span className="font-semibold text-foreground">
									{contract.monthlyRent?.toLocaleString("vi-VN")} VNĐ/tháng
								</span>
							</div>

							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<MapPin className="w-4 h-4" />
								<span>{contract.room?.property?.address}</span>
							</div>
						</div>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push(`/dashboard/landlord/contracts/${contract.id}`)}
						className="ml-4"
					>
						<Eye className="w-4 h-4 mr-2" />
						Chi tiết
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
