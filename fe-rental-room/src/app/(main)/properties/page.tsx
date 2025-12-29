'use client';

import React, { useState } from 'react';
import { useProperties } from '@/features/properties/hooks/use-properties';
import { PropertyListView } from '@/features/properties/components/property-list-view';
import { PropertyFilters } from '@/features/properties/components/property-filters';
import { PropertyFilterInput } from '@/features/properties/schemas';
import { Property } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PropertiesPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<PropertyFilterInput>({});

	const { data, isLoading, error } = useProperties();

	// Filter properties based on search and filters
	const properties = (data?.data || []).filter((property: Property) => {
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
		<div className="container py-8 space-y-8">
			<div className="space-y-2">
				<h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
					Khám phá các phòng cho thuê
				</h1>
				<p className="text-xl text-muted-foreground">
					Tìm kiếm nơi ở lý tưởng của bạn một cách dễ dàng và nhanh chóng
				</p>
			</div>

			<div className="space-y-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Tìm kiếm theo tên, địa chỉ hoặc quận..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 h-12 text-lg rounded-xl shadow-sm focus-visible:ring-primary"
					/>
				</div>

				<PropertyFilters onFiltersChange={setFilters} />
			</div>

			<PropertyListView
				properties={properties}
				isLoading={isLoading}
				error={error}
				emptyMessage="Không tìm thấy bất động sản nào phù hợp với tìm kiếm của bạn."
				isLandlordView={false}
			/>
		</div>
	);
}
