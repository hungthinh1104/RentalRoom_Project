"use client";

import React, { useState } from 'react';
import { useProperties } from '@/features/properties/hooks/use-properties';
import { PropertyListView } from '@/features/properties/components/property-list-view';
import { PropertyFilters } from '@/features/properties/components/property-filters';
import { PropertyFilterInput } from '@/features/properties/schemas';
import { Property } from '@/types';
import { Building2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PropertiesPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<PropertyFilterInput>({});

	const { properties: allProperties, isLoading, error } = useProperties();

	// Filter properties based on search and filters
	const properties = (allProperties || []).filter((property: Property) => {
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

	return (
		<div className="min-h-screen">
			{/* Hero Header - Clean & Minimal (Matching Rooms/Page) */}
			<div className="relative w-full bg-background border-b border-border">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
				<div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12">
					<div className="max-w-3xl">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
							<Building2 className="w-3.5 h-3.5 text-primary" />
							<span className="text-xs font-medium text-primary">Quản lý & Tìm kiếm</span>
						</div>
						<h1 className="text-6xl font-bold tracking-tight text-foreground mb-4">
							Khám phá các
							<span className="block text-5xl mt-2 bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
								tòa nhà cho thuê
							</span>
						</h1>
						<p className="text-lg text-muted-foreground leading-relaxed">
							Tìm kiếm nơi ở lý tưởng của bạn một cách dễ dàng và nhanh chóng trong hệ thống các tòa nhà hiện đại.
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">

				{/* Search & Filter Section */}
				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Tìm kiếm theo tên, địa chỉ hoặc quận..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 h-12 text-lg rounded-xl shadow-sm focus-visible:ring-primary max-w-2xl"
						/>
					</div>

					<PropertyFilters onFiltersChange={setFilters} />
				</div>

				{/* Results */}
				<PropertyListView
					properties={properties}
					isLoading={isLoading}
					error={error}
					emptyMessage="Không tìm thấy bất động sản nào phù hợp với tìm kiếm của bạn."
					isLandlordView={false}
				/>
			</div>
		</div>
	);
}
