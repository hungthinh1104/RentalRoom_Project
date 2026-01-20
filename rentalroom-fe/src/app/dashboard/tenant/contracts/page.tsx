"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { FileText, CalendarRange, MapPin, ShieldCheck, Wallet, ChevronRight, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { ContractStatusBadge } from "@/features/contracts/components/contract-status-badge";
import { ContractStatus, type Contract } from "@/types";
import { TenantReviewForm } from "@/features/feedback/components/tenant-review-form";
import Link from "next/link";
import { useMemo, useState } from "react";


function formatDate(value?: string | null) {
	return value ? format(new Date(value), "dd/MM/yyyy") : "—";
}

export default function TenantContractsPage() {
	const { data: session } = useSession();
	const tenantId = session?.user?.id;
	const contractsQuery = useContracts(tenantId ? { tenantId } : undefined);
	const contracts = useMemo(() => contractsQuery.data?.data ?? contractsQuery.data?.items ?? [], [contractsQuery.data]);

	// Review modal state
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

	const handleReviewClick = (contract: Contract) => {
		setSelectedContract(contract);
		setReviewModalOpen(true);
	};

	const handleReviewSuccess = () => {
		// Refresh contracts to update review status
		contractsQuery.refetch();
	};

	if (contractsQuery.isLoading) {
		return (
			<div className="container py-8 max-w-5xl space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
				</div>
			</div>
		);
	}

	return (
		<div className="container py-8 max-w-5xl space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Hợp đồng của tôi</h1>
				<p className="text-muted-foreground mt-2">
					Quản lý và xem chi tiết các hợp đồng thuê đang có hiệu lực.
				</p>
			</div>

			<div className="grid gap-6">
				{contracts.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
							<div className="p-4 rounded-full bg-muted/50">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Chưa có hợp đồng nào</h3>
								<p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
									Khi đơn đặt phòng của bạn được duyệt hoặc chủ nhà tạo hợp đồng, nó sẽ xuất hiện tại đây.
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					contracts.map((contract: Contract) => {
						// Check if contract is completed and can be reviewed
						const canReview = contract.status === ContractStatus.TERMINATED || contract.status === ContractStatus.EXPIRED;
						const hasReview = contract.reviews && contract.reviews.length > 0;

						return (
							<Link
								href={`/dashboard/tenant/contracts/${contract.id}`}
								key={contract.id}
								className="block group"
							>
								<Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50">
									<CardHeader className="bg-muted/30 pb-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
													<FileText className="h-5 w-5 text-primary" />
												</div>
												<div>
													<CardTitle className="text-lg group-hover:text-primary transition-colors">
														Hợp đồng #{contract.id.slice(0, 8)}
													</CardTitle>
													<CardDescription className="flex items-center gap-1 mt-1">
														<MapPin className="h-3 w-3" />
														{contract.room?.property?.name ?? "Đang cập nhật"}
														{contract.room?.roomNumber && ` - Phòng ${contract.room.roomNumber}`}
													</CardDescription>
												</div>
											</div>
											<ContractStatusBadge status={contract.status} />
										</div>
									</CardHeader>
									<CardContent className="p-6">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
											<div className="space-y-1">
												<span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Thời hạn</span>
												<div className="flex items-center gap-2 font-medium">
													<CalendarRange className="h-4 w-4 text-muted-foreground" />
													<span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
												</div>
											</div>

											<div className="space-y-1">
												<span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Giá thuê</span>
												<div className="flex items-center gap-2 font-medium">
													<Wallet className="h-4 w-4 text-muted-foreground" />
													<span>{contract.monthlyRent ? `${contract.monthlyRent.toLocaleString('vi-VN')} đ/tháng` : '—'}</span>
												</div>
											</div>

											<div className="space-y-1">
												<span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tiền cọc</span>
												<div className="flex items-center gap-2 font-medium">
													<ShieldCheck className="h-4 w-4 text-muted-foreground" />
													<span>{contract.deposit ? `${contract.deposit.toLocaleString('vi-VN')} đ` : '—'}</span>
												</div>
											</div>
										</div>

										{/* Show approve button for DRAFT contracts */}
										{contract.status === ContractStatus.DRAFT && (
											<div className="mt-4 pt-4 border-t flex items-center justify-between">
												<p className="text-sm text-muted-foreground">
													⚠️ Vui lòng xem xét và phê duyệt hợp đồng
												</p>
												<Button
													size="sm"
													className="gap-2"
													onClick={(e) => {
														e.preventDefault();
														// Will open approval modal
													}}
												>
													Phê duyệt hợp đồng
													<ChevronRight className="h-4 w-4" />
												</Button>
											</div>
										)}

										{/* Review section for completed contracts */}
										{canReview && (
											<div className="mt-4 pt-4 border-t">
												{hasReview ? (
													<div className="flex items-center gap-2">
														<Badge variant="secondary" className="gap-2">
															<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
															Đã đánh giá
														</Badge>
														<span className="text-sm text-muted-foreground">
															Cảm ơn bạn đã đánh giá!
														</span>
													</div>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="gap-2"
														onClick={(e) => {
															e.preventDefault();
															handleReviewClick(contract);
														}}
													>
														<MessageSquare className="h-4 w-4" />
														Đánh giá phòng
													</Button>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							</Link>
						);
					})
				)}
			</div>

			{/* Review Modal */}
			{selectedContract && (
				<TenantReviewForm
					contractId={selectedContract.id}
					roomNumber={selectedContract.room?.roomNumber || ""}
					open={reviewModalOpen}
					onOpenChange={setReviewModalOpen}
					onSuccess={handleReviewSuccess}
				/>
			)}
		</div>
	);
}
