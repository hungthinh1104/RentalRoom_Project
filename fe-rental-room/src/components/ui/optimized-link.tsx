/**
 * Optimized Link component with prefetch on hover
 * Reduces navigation delay by preloading routes
 */

import NextLink, { LinkProps } from 'next/link';
import { usePrefetchOnHover } from '@/hooks/use-prefetch';
import { ReactNode } from 'react';

interface OptimizedLinkProps extends LinkProps {
    children: ReactNode;
    className?: string;
    prefetch?: boolean;
}

export function OptimizedLink({
    href,
    children,
    className,
    prefetch = true,
    ...props
}: OptimizedLinkProps) {
    const prefetchProps = usePrefetchOnHover(href.toString());

    return (
        <NextLink
            href={href}
            className={className}
            {...props}
            {...(prefetch ? prefetchProps : {})}
        >
            {children}
        </NextLink>
    );
}
