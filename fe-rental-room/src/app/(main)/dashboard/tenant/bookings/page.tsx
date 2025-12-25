"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { CalendarClock, CheckCircle2, Clock, Mail, MapPin, MessageSquare, XCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/features/contracts/hooks/use-contracts";
import { ApplicationStatus, type RentalApplication } from "@/types";

const statusCopy: Record<ApplicationStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
	[ApplicationStatus.PENDING]: { label: "Chờ duyệt", color: "bg-warning-light text-warning border-warning/20", icon: Clock },
	[ApplicationStatus.APPROVED]: { label: "Đã duyệt", color: "bg-success-light text-success border-success/20", icon: CheckCircle2 },
	[ApplicationStatus.REJECTED]: { label: "Từ chối", color: "bg-destructive-light text-destructive border-destructive/20", icon: XCircle },
	[ApplicationStatus.WITHDRAWN]: { label: "Đã rút", color: "bg-muted text-muted-foreground border-border", icon: Clock },
};

function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy") : "—";
}

export default function TenantBookingsPage() {
	const { data: session } = useSession();
	const tenantId = session?.user?.id;
	const applicationsQuery = useApplications(
		tenantId ? { tenantId, status: undefined } : undefined,
		{ enabled: !!tenantId }
	);
	const applications = applicationsQuery.data?.data ?? applicationsQuery.data?.items ?? [];

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-bold text-foreground">Đơn đặt phòng</h1>
				<p className="text-muted-foreground text-sm">Theo dõi tiến trình các đơn đăng ký thuê phòng của bạn.</p>
			</div>

			<Card className="border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-muted/60 backdrop-blur-xl rounded-[32px] shadow-xl shadow-muted/30">
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center justify-between text-lg font-semibold">
						<span>Tình trạng đơn</span>
						<Badge variant="secondary" className="text-xs">Cập nhật theo thời gian thực</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4 space-y-4">

					{(!applicationsQuery.isLoading && applications.length === 0) && (
						<div className="rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-3">
							<div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
								<CalendarClock className="h-6 w-6 text-muted-foreground" />
							</div>
							<div>
								<p className="font-semibold">Chưa có đơn nào</p>
								<p className="text-sm text-muted-foreground">Bắt đầu bằng cách chọn phòng và gửi đơn đăng ký thuê.</p>
							</div>
						</div>
					)}

					{!applicationsQuery.isLoading && applications.map((app: RentalApplication) => {
						const status = statusCopy[app.status];
						const StatusIcon = status.icon;
						    return (
							    <Link href={`/dashboard/tenant/bookings/${app.id}`} key={app.id} className="rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-muted/60 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-muted/30 flex flex-col gap-3 transition-all duration-200 hover:border-primary/30 hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40">
								<div className="flex items-center justify-between gap-3 flex-wrap">
									<div className="flex items-center gap-3">
										<div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold ring-1 ring-primary/20">
											{app.roomNumber ?? app.roomId?.slice(0, 4) ?? "RM"}
										</div>
										<div>
											<p className="font-semibold text-base md:text-lg">Phòng {app.roomNumber ?? app.roomId}</p>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												<span className="line-clamp-1">{app.roomAddress ?? "Chưa có địa chỉ"}</span>
											</div>
										</div>
									</div>
									<Badge className={`border ${status.color} gap-1 rounded-full px-3 py-1 text-xs font-semibold`}>
										<StatusIcon className="h-4 w-4" />
										{status.label}
									</Badge>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4" />
										<span>Ngày gửi: {formatDate(app.createdAt)}</span>
									</div>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4" />
										<span>Liên hệ: {app.tenantEmail ?? "—"}</span>
									</div>
									<div className="flex items-center gap-2">
										<MessageSquare className="h-4 w-4" />
										<span>Ghi chú: {app.message?.slice(0, 80) || "Không có"}</span>
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
