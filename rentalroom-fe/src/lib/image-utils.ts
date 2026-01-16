/**
 * Image optimization utilities
 * Provides blur placeholders and image URL helpers
 */

/**
 * Generate a low-quality blur placeholder for images
 * Used with Next.js Image component for smooth loading
 */
export function getBlurDataURL(width = 10, height = 10): string {
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
    </svg>
  `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate ImageKit transformation URL
 * Optimizes images with width, height, quality, and format
 */
export function getOptimizedImageUrl(
    imageUrl: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'auto' | 'webp' | 'jpg' | 'png';
    } = {},
): string {
    const { width, height, quality = 80, format = 'auto' } = options;

    // If not an ImageKit URL, return as-is
    if (!imageUrl || !imageUrl.includes('imagekit.io')) {
        return imageUrl;
    }

    // Build transformation string
    const transformations: string[] = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    transformations.push(`q-${quality}`);
    transformations.push(`f-${format}`);

    const tr = transformations.join(',');

    // Insert transformation into URL
    // Example: https://ik.imagekit.io/demo/image.jpg
    // Becomes: https://ik.imagekit.io/demo/tr:w-400,h-300,q-80,f-auto/image.jpg
    const parts = imageUrl.split('/');
    const filename = parts.pop();
    return `${parts.join('/')}/tr:${tr}/${filename}`;
}

/**
 * Get responsive image sizes for Next.js Image component
 * Optimizes for different screen sizes
 */
export function getResponsiveSizes(type: 'card' | 'hero' | 'thumbnail' | 'full'): string {
    switch (type) {
        case 'thumbnail':
            return '(max-width: 640px) 100px, 150px';
        case 'card':
            return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
        case 'hero':
            return '100vw';
        case 'full':
            return '(max-width: 1024px) 100vw, 1200px';
        default:
            return '100vw';
    }
}
