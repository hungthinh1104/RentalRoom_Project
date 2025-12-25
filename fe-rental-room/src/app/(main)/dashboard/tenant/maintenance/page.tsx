"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardList, Hammer, HelpCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tips = [
	{ title: "Mô tả rõ ràng", desc: "Ghi chi tiết vấn đề và vị trí trong phòng để xử lý nhanh hơn." },
	{ title: "Đính kèm hình ảnh", desc: "Thêm ảnh giúp kỹ thuật viên chẩn đoán chính xác." },
	{ title: "Ưu tiên an toàn", desc: "Nếu có nguy cơ mất an toàn, hãy liên hệ khẩn cấp với chủ nhà." },
];

const placeholders = [
	{ title: "Rò rỉ nước", status: "Đang chờ", color: "bg-amber-100 text-amber-700 border-amber-200" },
	{ title: "Điều hòa không mát", status: "Đã tiếp nhận", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

export default function TenantMaintenancePage() {
	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-bold text-foreground">Bảo trì</h1>
				<p className="text-muted-foreground text-sm">Gửi yêu cầu sửa chữa và theo dõi tình trạng xử lý.</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2 border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
					<CardHeader className="pb-0 flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-lg font-semibold">
							<Hammer className="h-5 w-5 text-primary" />
							Yêu cầu bảo trì
						</CardTitle>
						<Badge variant="secondary" className="text-xs">Thời gian phản hồi tiêu chuẩn &lt; 24h</Badge>
					</CardHeader>
					<CardContent className="pt-4 space-y-4">
						<div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-4">
							<div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
								<ClipboardList className="h-6 w-6 text-muted-foreground" />
							</div>
							<div className="space-y-2">
								<p className="font-semibold">Bạn chưa có yêu cầu nào</p>
								<p className="text-sm text-muted-foreground">Tạo yêu cầu mới để chúng tôi hỗ trợ nhanh nhất.</p>
							</div>
							<div className="flex items-center justify-center">
								<Button asChild className="gap-2">
									<Link href="/dashboard/tenant/maintenance/new">
										<Plus className="h-4 w-4" />
										Tạo yêu cầu
									</Link>
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{placeholders.map((item) => (
								<div key={item.title} className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2">
									<div className="flex items-center justify-between">
										<p className="font-semibold">{item.title}</p>
										<Badge className={`border ${item.color}`}>{item.status}</Badge>
									</div>
									<p className="text-sm text-muted-foreground">Ví dụ minh họa để bạn hình dung quy trình xử lý.</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
					<CardHeader className="pb-0">
						<CardTitle className="flex items-center gap-2 text-lg font-semibold">
							<AlertTriangle className="h-5 w-5 text-amber-500" />
							Hướng dẫn nhanh
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-4">
						{tips.map((tip) => (
							<div key={tip.title} className="rounded-2xl border border-border/80 p-4 bg-muted/40 space-y-2">
								<div className="flex items-center gap-2 font-semibold">
									<HelpCircle className="h-4 w-4 text-primary" />
									{tip.title}
								</div>
								<p className="text-sm text-muted-foreground">{tip.desc}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
