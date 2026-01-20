"use client";

import { useProperties } from "@/features/properties/hooks/use-properties";
import { PropertyGrid } from "@/features/properties/components/PropertyGrid";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { PropertyWizard } from "@/features/properties/components/PropertyWizard";

export default function PropertiesPage() {
	const [searchTerm, setSearchTerm] = useState("");
	// Simple debounce or just pass state for now
	const { properties, isLoading } = useProperties({ search: searchTerm });
	const [isWizardOpen, setIsWizardOpen] = useState(false);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Bất động sản</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Quản lý danh sách tòa nhà, căn hộ và phòng cho thuê của bạn.
					</p>
				</div>
				<Button
					onClick={() => setIsWizardOpen(true)}
					variant="premium"
					className="shadow-lg transition-all"
				>
					<Plus className="mr-2 h-4 w-4" />
					Thêm Bất động sản
				</Button>
			</div>

			{/* Toolbox */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Tìm kiếm theo tên, địa chỉ..."
						className="pl-9 bg-card/50 border-white/10 focus:border-primary/50 transition-colors"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				{/* Add Filters here later (City, Type) */}
			</div>

			{/* Grid */}
			<PropertyGrid properties={properties} isLoading={isLoading} />

			{/* Wizard Modal */}
			<PropertyWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
		</div>
	);
}
