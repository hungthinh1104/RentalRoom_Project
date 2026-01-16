/**
 * Optimized Image Component
 * Wrapper around Next.js Image with built-in optimizations
 */

import NextImage, { ImageProps } from 'next/image';
import { getBlurDataURL, getResponsiveSizes } from '@/lib/image-utils';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
    sizeType?: 'card' | 'hero' | 'thumbnail' | 'full';
    enableBlur?: boolean;
}

export function OptimizedImage({
    sizeType = 'card',
    enableBlur = true,
    sizes,
    ...props
}: OptimizedImageProps) {
    return (
        <NextImage
            {...props}
            sizes={sizes || getResponsiveSizes(sizeType)}
            placeholder={enableBlur ? 'blur' : 'empty'}
            blurDataURL={enableBlur ? getBlurDataURL() : undefined}
            loading={props.priority ? 'eager' : 'lazy'}
        />
    );
}
