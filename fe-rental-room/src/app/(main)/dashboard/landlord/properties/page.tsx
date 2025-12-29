"use client";

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProperties } from '@/features/properties/hooks/use-properties';
import { PropertyListView } from '@/features/properties/components/property-list-view';
import { PropertyFilters } from '@/features/properties/components/property-filters';
import { DashboardStats } from '@/features/properties/components/dashboard-stats';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';
import type { Property } from '@/types';
import type { PropertyFilterInput } from '@/features/properties/schemas';
import { toast } from 'sonner';
import { propertiesApi } from '@/features/properties/api/properties-api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandlordPropertiesPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<PropertyFilterInput>({});
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [isFilterVisible, setIsFilterVisible] = useState(false);
	const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
	const [isDeleteLoading, setIsDeleteLoading] = useState(false);

	const { data, isLoading, error } = useProperties({
		landlordId: session?.user?.id,
	});

	const properties = useMemo(() => data?.data || [], [data]);

	// Filter properties based on search and filters
	const filteredProperties = useMemo(() => {
		return properties.filter((property: Property) => {
			const matchesSearch =
				searchQuery === '' ||
				property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
				property.ward.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesFilters =
				(!filters.search || property.name.toLowerCase().includes(filters.search.toLowerCase())) &&
				(!filters.city || property.city.toLowerCase().includes(filters.city.toLowerCase())) &&
				(!filters.ward || property.ward.toLowerCase().includes(filters.ward.toLowerCase())) &&
				(!filters.propertyType || property.propertyType === filters.propertyType);

			return matchesSearch && matchesFilters;
		});
	}, [properties, searchQuery, filters]);

	const handleDelete = async () => {
		if (!deleteProperty) return;

		setIsDeleteLoading(true);
		try {
			await propertiesApi.delete(deleteProperty.id);

			toast.success('Bất động sản được xóa thành công!');
			setDeleteProperty(null);
			// Refetch properties using query invalidation (handled by useDeleteProperty but here we use direct api call)
			router.refresh();
		} catch (error) {
			console.error('Error deleting property:', error);
			toast.error(
				error instanceof Error ? error.message : 'Không thể xóa bất động sản'
			);
		} finally {
			setIsDeleteLoading(false);
		}
	};

	return (
		<div className="space-y-8 pb-10">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
				<div>
					<motion.h1
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
					>
						Quản lý Bất động sản
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="text-muted-foreground mt-1"
					>
						Tổng quan và quản lý danh sách căn hộ, văn phòng của bạn
					</motion.p>
				</div>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2 }}
				>
					<Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
						<Link href="/dashboard/landlord/properties/new">
							<Plus className="w-5 h-5" />
							Thêm bất động sản
						</Link>
					</Button>
				</motion.div>
			</div>

			{/* Statistics Section */}
			{!isLoading && properties.length > 0 && (
				<DashboardStats properties={properties} />
			)}

			{/* Search & Filters Section (Sticky) */}
			<div className="sticky top-0 z-20 py-4 -mx-4 px-4 bg-background/80 backdrop-blur-md border-b border-border/50">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
					{/* Search Bar */}
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
						/>
					</div>

					{/* Controls */}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							className={cn("h-11 w-11 transition-colors", isFilterVisible && "bg-primary/10 border-primary/20 text-primary")}
							onClick={() => setIsFilterVisible(!isFilterVisible)}
						>
							<SlidersHorizontal className="w-4 h-4" />
						</Button>

						<div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
							<Button
								variant={viewMode === 'grid' ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setViewMode('grid')}
								className="h-9 w-9 p-0"
							>
								<LayoutGrid className="w-4 h-4" />
							</Button>
							<Button
								variant={viewMode === 'list' ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setViewMode('list')}
								className="h-9 w-9 p-0"
							>
								<List className="w-4 h-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Expanded Filters */}
				<AnimatePresence>
					{isFilterVisible && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className="overflow-hidden"
						>
							<div className="pt-4 max-w-7xl mx-auto">
								<PropertyFilters onFiltersChange={setFilters} />
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Properties List/Grid */}
			<PropertyListView
				properties={filteredProperties}
				isLoading={isLoading}
				error={error}
				emptyMessage="Chưa có bất động sản nào khớp với tìm kiếm của bạn."
				isLandlordView={true}
				viewMode={viewMode}
				onEdit={(property) => router.push(`/dashboard/landlord/properties/${property.id}/edit`)}
				onDelete={(property) => setDeleteProperty(property)}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmationDialog
				isOpen={!!deleteProperty}
				onConfirm={handleDelete}
				onCancel={() => setDeleteProperty(null)}
				title="Xóa bất động sản"
				description="Hành động này sẽ xóa vĩnh viễn bất động sản này và tất cả các phòng liên quan. Bạn có chắc chắn không?"
				itemName={deleteProperty ? deleteProperty.name : ""}
				isLoading={isDeleteLoading}
			/>
		</div>
	);
}
