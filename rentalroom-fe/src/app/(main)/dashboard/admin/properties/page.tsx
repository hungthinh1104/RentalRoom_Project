"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Search, MoreHorizontal, Eye, Trash2, MapPin, Home } from "lucide-react";
import { useAdminProperties, useDeleteProperty, type Property } from "@/features/admin/hooks/use-admin-properties";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminPropertiesPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

	const { data, isLoading } = useAdminProperties({ page, search });
	const deleteProperty = useDeleteProperty();

	const properties = data?.items || [];
	const total = data?.total || 0;

	const handleSearchChange = (value: string) => {
		if (debounceTimer) clearTimeout(debounceTimer);
		const timer = setTimeout(() => {
			setSearch(value);
			setPage(1);
		}, 300);
		setDebounceTimer(timer);
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			await deleteProperty.mutateAsync(deleteId);
			toast.success("Đã xóa bất động sản");
			setDeleteId(null);
		} catch (error: unknown) {
			const message = error && typeof error === 'object' && 'response' in error ? 
				(error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
			toast.error(message || "Không thể xóa bất động sản");
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Quản lý bất động sản</h1>
					<p className="text-muted-foreground mt-1">
						Tổng quan tất cả bất động sản trên nền tảng ({total} bất động sản)
					</p>
				</div>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Tìm theo tên, địa chỉ..."
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-9"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Properties Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						Danh sách bất động sản
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : properties.length === 0 ? (
						<div className="text-center py-12">
							<Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
							<p className="text-muted-foreground">Không tìm thấy bất động sản nào</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Tên</TableHead>
									<TableHead>Địa chỉ</TableHead>
									<TableHead>Chủ nhà</TableHead>
									<TableHead className="text-center">Số phòng</TableHead>
									<TableHead className="w-[70px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{properties.map((property: Property) => (
									<TableRow key={property.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className={cn(
													"p-2 rounded-lg",
													"bg-primary/10 text-primary"
												)}>
													<Home className="h-4 w-4" />
												</div>
												<span className="font-medium">{property.name}</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-muted-foreground">
												<MapPin className="h-3 w-3" />
												<span className="text-sm truncate max-w-[200px]">{property.address}</span>
											</div>
										</TableCell>
										<TableCell>{property.landlordName}</TableCell>
										<TableCell className="text-center">
											<Badge variant="secondary">{property.roomCount} phòng</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Thao tác</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<DropdownMenuItem>
														<Eye className="mr-2 h-4 w-4" />
														Xem chi tiết
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setDeleteId(property.id)}
														className="text-destructive focus:text-destructive"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Xóa
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
						<AlertDialogDescription>
							Bạn có chắc muốn xóa bất động sản này? Tất cả phòng liên quan cũng sẽ bị xóa.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Xóa
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
