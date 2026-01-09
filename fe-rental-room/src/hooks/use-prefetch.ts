/**
 * Prefetch utilities for faster navigation
 * Preloads routes and components on hover
 */

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Hook to prefetch a route on hover
 * Reduces navigation delay by preloading the page
 */
export function usePrefetchOnHover(href: string) {
    const router = useRouter();
    const hasPrefe tched = useRef(false);

    const handleMouseEnter = () => {
        if (!hasPrefetched.current && href) {
            router.prefetch(href);
            hasPrefetched.current = true;
        }
    };

    return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook to prefetch multiple routes
 * Useful for navigation menus
 */
export function usePrefetchRoutes(routes: string[]) {
    const router = useRouter();

    useEffect(() => {
        // Prefetch all routes after a short delay
        const timer = setTimeout(() => {
            routes.forEach((route) => {
                router.prefetch(route);
            });
        }, 1000); // Wait 1s after mount

        return () => clearTimeout(timer);
    }, [routes, router]);
}

/**
 * Prefetch component on hover
 * Dynamically imports component before user clicks
 */
export function usePrefetchComponent<T>(
    importFn: () => Promise<{ default: T }>,
) {
    const componentRef = useRef<T | null>(null);
    const hasPrefetched = useRef(false);

    const handleMouseEnter = async () => {
        if (!hasPrefetched.current) {
            hasPrefetched.current = true;
            const module = await importFn();
            componentRef.current = module.default;
        }
    };

    return { onMouseEnter: handleMouseEnter, component: componentRef.current };
}
