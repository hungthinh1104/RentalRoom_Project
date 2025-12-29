import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="container py-6 space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
			</div>
			<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
				{Array.from({ length: 6 }).map((_, idx) => (
					<Skeleton key={idx} className="h-24" />
				))}
			</div>
			<Skeleton className="h-72" />
			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-64" />
				<Skeleton className="h-64" />
			</div>
		</div>
	);
}
