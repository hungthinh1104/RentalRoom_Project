import { useEffect, useState } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => (typeof window !== 'undefined' && typeof window.matchMedia === 'function') ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const listener = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
        // Legacy browsers
        else {
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        }
    }, []);

    return prefersReducedMotion;
}
