"use client";

import { LandlordContractsList } from "@/features/contracts/components/landlord-contracts-list";
import { ApplicationsList } from "@/features/contracts/components/applications-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandlordContractsPage() {
	return (
		<div className="container py-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Quản lý Hợp đồng & Đơn thuê</h1>
				<p className="text-muted-foreground">
					Xem và quản lý tất cả hợp đồng thuê và đơn đăng ký thuê phòng.
				</p>
			</div>

			<Tabs defaultValue="applications" className="w-full">
				<TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
					<TabsTrigger value="applications">Đơn xin thuê</TabsTrigger>
					<TabsTrigger value="contracts">Hợp đồng</TabsTrigger>
				</TabsList>

				<TabsContent value="applications" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Đơn xin thuê phòng</CardTitle>
							<CardDescription>
								Danh sách các yêu cầu thuê phòng đang chờ duyệt hoặc đã xử lý.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ApplicationsList view="landlord" />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="contracts" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Hợp đồng thuê</CardTitle>
							<CardDescription>
								Danh sách các hợp đồng thuê đang hoạt động hoặc đã kết thúc.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<LandlordContractsList />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
