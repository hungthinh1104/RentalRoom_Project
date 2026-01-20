'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

/**
 * Offline banner that shows when user loses internet connection
 * Automatically appears/disappears based on network status
 */
export function OfflineBanner() {
    const isOnline = useOnlineStatus();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Don't render during SSR or initial client-side hydration
    if (!mounted || isOnline) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 bg-warning text-white px-4 py-3 text-center z-50 shadow-lg">
            <div className="flex items-center justify-center gap-2">
                <WifiOff className="h-5 w-5" />
                <span className="font-medium">
                    Bạn đang offline. Một số tính năng có thể không hoạt động.
                </span>
            </div>
        </div>
    );
}
