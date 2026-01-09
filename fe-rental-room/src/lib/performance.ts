/**
 * Performance monitoring utilities
 * Track and log performance metrics
 */

/**
 * Measure component render time
 * Useful for identifying slow components
 */
export function measureRenderTime(componentName: string) {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
        return { start: () => { }, end: () => { } };
    }

    let startTime: number;

    return {
        start: () => {
            startTime = performance.now();
        },
        end: () => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (duration > 16) { // Slower than 60fps (16.67ms)
                console.warn(
                    `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render (> 16ms)`,
                );
            }
        },
    };
}

/**
 * Log Web Vitals (CLS, FID, LCP, FCP, TTFB)
 * Helps identify performance bottlenecks
 */
export function logWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    label: string;
}) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    const { name, value } = metric;

    // Thresholds for good performance
    const thresholds: Record<string, number> = {
        CLS: 0.1, // Cumulative Layout Shift
        FID: 100, // First Input Delay (ms)
        LCP: 2500, // Largest Contentful Paint (ms)
        FCP: 1800, // First Contentful Paint (ms)
        TTFB: 600, // Time to First Byte (ms)
    };

    const threshold = thresholds[name];
    const status = threshold && value > threshold ? '❌ POOR' : '✅ GOOD';

    console.log(`[Web Vitals] ${name}: ${value.toFixed(2)} ${status}`);
}

/**
 * Detect slow network
 * Returns true if connection is slow (2G, slow-3G)
 */
export function isSlowNetwork(): boolean {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
        return false;
    }

    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    return effectiveType === 'slow-2g' || effectiveType === '2g';
}

/**
 * Get device memory (if available)
 * Useful for adaptive loading strategies
 */
export function getDeviceMemory(): number | undefined {
    if (typeof navigator === 'undefined') {
        return undefined;
    }

    return (navigator as any).deviceMemory;
}

/**
 * Check if device is low-end
 * Based on memory and network speed
 */
export function isLowEndDevice(): boolean {
    const memory = getDeviceMemory();
    const slowNetwork = isSlowNetwork();

    // Low memory (< 4GB) or slow network
    return (memory !== undefined && memory < 4) || slowNetwork;
}
