import { Property } from '@/types';
import { PropertyCard } from './property-card';
import { AlertCircle, Inbox, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PropertyListViewProps {
	properties: Property[];
	isLoading?: boolean;
	error?: Error | null;
	emptyMessage?: string;
	isLandlordView?: boolean;
	title?: string;
	description?: string;
	showCreateButton?: boolean;
	viewMode?: 'grid' | 'list';
	onEdit?: (property: Property) => void;
	onDelete?: (property: Property) => void;
}

export function PropertyListView({
	properties,
	isLoading,
	error,
	emptyMessage = 'Không có bất động sản nào.',
	isLandlordView = false,
	showCreateButton = isLandlordView,
	viewMode = 'grid',
	onEdit,
	onDelete,
}: PropertyListViewProps) {
	// Loading state
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-[420px] rounded-2xl bg-muted/50 animate-pulse border border-border/50"
						/>
					))}
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					Không thể tải danh sách bất động sản. Vui lòng thử lại sau.
				</AlertDescription>
			</Alert>
		);
	}

	// Empty state
	if (properties.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl border-2 border-dashed border-border/50 bg-muted/20">
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"
				>
					<Inbox className="w-10 h-10 text-muted-foreground/50" />
				</motion.div>
				<h3 className="text-xl font-semibold text-foreground">Không tìm thấy dữ liệu</h3>
				<p className="text-muted-foreground text-center mt-2 max-w-sm">
					{emptyMessage}
				</p>
				{showCreateButton && (
					<Button asChild className="mt-8 px-8 h-12 rounded-full">
						<Link href="/dashboard/landlord/properties/new" className="flex items-center gap-2">
							<Plus className="w-5 h-5" />
							Thêm bất động sản ngay
						</Link>
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<AnimatePresence mode="popLayout">
				<motion.div
					layout
					className={cn(
						"grid gap-6",
						viewMode === 'grid'
							? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
							: "grid-cols-1"
					)}
				>
					{properties.map((property) => (
						<motion.div
							layout
							key={property.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.2 }}
						>
							<PropertyCard
								property={property}
								isLandlordView={isLandlordView}
								viewMode={viewMode}
								onEdit={onEdit}
								onDelete={onDelete}
							/>
						</motion.div>
					))}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
