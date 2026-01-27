import { useEffect, useState } from 'react';
import { authRateLimiter } from '@/lib/security/rate-limiter';

/**
 * Custom hook for rate limit countdown timer
 * 
 * @param key - Rate limiter key (e.g., 'login', 'register')
 * @param isLimited - Whether rate limit is currently active
 * @returns Object containing countdown seconds and reset function
 * 
 * @example
 * ```tsx
 * const { seconds, reset } = useRateLimitCountdown('login', isRateLimited);
 * 
 * return (
 *   <div>
 *     {isRateLimited && <p>Vui lòng đợi {seconds} giây</p>}
 *   </div>
 * );
 * ```
 */
export function useRateLimitCountdown(key: string, isLimited: boolean) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!isLimited) {
            setSeconds(0);
            return;
        }

        // Update immediately
        const remaining = authRateLimiter.getBackoffSeconds(key);
        setSeconds(remaining);

        // Then update every second
        const interval = setInterval(() => {
            const remaining = authRateLimiter.getBackoffSeconds(key);
            setSeconds(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [key, isLimited]);

    const reset = () => {
        setSeconds(0);
    };

    return { seconds, reset };
}
