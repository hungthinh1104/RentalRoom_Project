"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DollarSign,
	Search,
	CheckCircle2,
	Clock,
	XCircle,
	User,
	Home,
	Calendar,
	CreditCard,
} from "lucide-react";
import { Payment, PaymentStatus, PaymentMethod } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api/client";

export function LandlordPaymentsList() {
	const { data: session } = useSession();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");

	const { data: payments, isLoading } = useQuery({
		queryKey: ["landlord-payments", session?.user?.id],
		queryFn: async () => {
			const { data } = await api.get<Payment[] | { data: Payment[] }>("/payments", {
				params: { landlordId: session?.user?.id },
			});
			// Handle both direct array response and wrapped response
			return Array.isArray(data) ? data : data?.data || [];
		},
		enabled: !!session?.user?.id,
	});

	const filteredPayments = (payments || []).filter((payment: Payment) => {
		const matchesSearch =
			searchQuery === "" ||
			payment.tenant?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			payment.invoice?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const totalRevenue = filteredPayments
		.filter((p: Payment) => p.status === "COMPLETED")
		.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

	const pendingAmount = filteredPayments
		.filter((p: Payment) => p.status === "PENDING")
		.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);

	const getStatusBadge = (status: PaymentStatus) => {
		const variants = {
			COMPLETED: { variant: "default" as const, icon: CheckCircle2, label: "Đã thanh toán" },
			PENDING: { variant: "secondary" as const, icon: Clock, label: "Chờ thanh toán" },
			FAILED: { variant: "destructive" as const, icon: XCircle, label: "Thất bại" },
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

	const getMethodLabel = (method: PaymentMethod) => {
		const labels = {
			CASH: "Tiền mặt",
			BANK_TRANSFER: "Chuyển khoản",
			MOMO: "Ví MoMo",
			ZALOPAY: "Ví ZaloPay",
		};
		return labels[method] || method;
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-12 w-64" />
				<div className="grid gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-32" />
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
					<h1 className="text-3xl font-bold">Thanh toán</h1>
					<p className="text-muted-foreground">Theo dõi các khoản thanh toán từ khách thuê</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
						<DollarSign className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{new Intl.NumberFormat("vi-VN", {
								style: "currency",
								currency: "VND",
							}).format(totalRevenue)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">Đã thanh toán</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
						<Clock className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{new Intl.NumberFormat("vi-VN", {
								style: "currency",
								currency: "VND",
							}).format(pendingAmount)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">Chưa thanh toán</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
						<CreditCard className="w-4 h-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{filteredPayments.length}</div>
						<p className="text-xs text-muted-foreground mt-1">Giao dịch</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Tìm theo tên khách thuê hoặc mã hóa đơn..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | "ALL")}>
					<TabsList>
						<TabsTrigger value="ALL">Tất cả</TabsTrigger>
						<TabsTrigger value="COMPLETED">Đã thanh toán</TabsTrigger>
						<TabsTrigger value="PENDING">Chờ thanh toán</TabsTrigger>
						<TabsTrigger value="FAILED">Thất bại</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Payments Table */}
			{filteredPayments.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Chưa có giao dịch nào</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="px-4 py-3 text-left text-sm font-medium">Khách thuê</th>
										<th className="px-4 py-3 text-left text-sm font-medium">Phòng</th>
										<th className="px-4 py-3 text-left text-sm font-medium">Số tiền</th>
										<th className="px-4 py-3 text-left text-sm font-medium">Phương thức</th>
										<th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
										<th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
									</tr>
								</thead>
								<tbody>
									{filteredPayments.map((payment: Payment) => (
										<tr key={payment.id} className="border-b hover:bg-muted/50">
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm">
														{payment.tenant?.user?.fullName || "N/A"}
													</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<Home className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm">
														{payment.invoice?.contract?.room?.roomNumber || "N/A"}
													</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<span className="text-sm font-semibold">
													{new Intl.NumberFormat("vi-VN", {
														style: "currency",
														currency: "VND",
													}).format(Number(payment.amount))}
												</span>
											</td>
											<td className="px-4 py-3">
												<span className="text-sm">{getMethodLabel(payment.paymentMethod)}</span>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4 text-muted-foreground" />
													<span className="text-sm">
														{format(new Date(payment.paymentDate), "dd/MM/yyyy", {
															locale: vi,
														})}
													</span>
												</div>
											</td>
											<td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}