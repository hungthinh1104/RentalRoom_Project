"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { FileText, CalendarRange, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { ContractStatus, type Contract } from "@/types";
import Link from "next/link";

const statusMap: Record<ContractStatus, { label: string; color: string }> = {
	[ContractStatus.ACTIVE]: { label: "Đang hiệu lực", color: "bg-success-light text-success border-success/20" },
	[ContractStatus.TERMINATED]: { label: "Đã chấm dứt", color: "bg-destructive-light text-destructive border-destructive/20" },
	[ContractStatus.EXPIRED]: { label: "Hết hạn", color: "bg-warning-light text-warning border-warning/20" },
};

function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy") : "—";
}

export default function TenantContractsPage() {
	const { data: session } = useSession();
	const tenantId = session?.user?.id;
	const contractsQuery = useContracts(tenantId ? { tenantId } : undefined);
	const contracts = contractsQuery.data?.data ?? contractsQuery.data?.items ?? [];

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-bold text-foreground">Hợp đồng của tôi</h1>
				<p className="text-muted-foreground text-sm">Quản lý và xem chi tiết các hợp đồng thuê đang có hiệu lực.</p>
			</div>

			<Card className="border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-muted/60 backdrop-blur-xl rounded-[32px] shadow-xl shadow-muted/30">
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center gap-2 text-lg font-semibold">
						<ShieldCheck className="h-5 w-5 text-primary" />
						Trạng thái hợp đồng
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4 space-y-4">
					{contractsQuery.isLoading && (
						<div className="space-y-3">
							{[...Array(3)].map((_, idx) => (
								<Skeleton key={idx} className="h-24 w-full rounded-3xl" />
							))}
						</div>
					)}

					{!contractsQuery.isLoading && contracts.length === 0 && (
						<div className="rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-3">
							<div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
								<FileText className="h-6 w-6 text-muted-foreground" />
							</div>
							<div>
								<p className="font-semibold">Chưa có hợp đồng</p>
								<p className="text-sm text-muted-foreground">Khi đơn đặt phòng được duyệt, hợp đồng sẽ xuất hiện tại đây.</p>
							</div>
						</div>
					)}

					{!contractsQuery.isLoading && contracts.map((contract: Contract) => {
						const status = contract.status ? statusMap[contract.status] : undefined;
						    return (
							    <Link href={`/dashboard/tenant/contracts/${contract.id}`} key={contract.id} className="rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-muted/60 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-muted/30 flex flex-col gap-3 transition-all duration-200 hover:border-primary/30 hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40">
								<div className="flex items-center justify-between gap-3 flex-wrap">
									<div className="flex items-center gap-3">
										<div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold ring-1 ring-primary/20">
												{contract.id.slice(0, 4)}
											</div>
										<div>
											<p className="font-semibold text-base md:text-lg">Hợp đồng #{contract.id.slice(0, 6)}</p>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												<span className="line-clamp-1">{contract.room?.property?.address ?? contract.room?.property?.name ?? "Đang cập nhật"}</span>
											</div>
										</div>
									</div>
									{status && <Badge className={`border ${status.color} rounded-full px-3 py-1 text-xs font-semibold`}>{status.label}</Badge>}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<CalendarRange className="h-4 w-4" />
										<span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
									</div>
									<div className="flex items-center gap-2">
										<Wallet className="h-4 w-4" />
										<span>Tiền thuê: {contract.monthlyRent ? `${contract.monthlyRent.toLocaleString('vi-VN')}đ/tháng` : '—'}</span>
									</div>
									<div className="flex items-center gap-2">
										<ShieldCheck className="h-4 w-4" />
										<span>Cọc: {contract.deposit ? `${contract.deposit.toLocaleString('vi-VN')}đ` : '—'}</span>
									</div>
								</div>
							</Link>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
