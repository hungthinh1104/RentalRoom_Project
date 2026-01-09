import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full page loading skeleton
 * Use for entire page loads
 */
export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="space-y-4 w-full max-w-4xl px-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </div>
    );
}

/**
 * Card grid loading skeleton
 * Use for lists of cards (rooms, properties, etc.)
 */
export function CardLoader({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}

/**
 * Table loading skeleton
 * Use for data tables
 */
export function TableLoader({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    );
}

/**
 * Form loading skeleton
 * Use for forms
 */
export function FormLoader() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
}
