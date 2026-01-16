/**
 * Adaptive loading strategies based on device capabilities
 * Reduces features on low-end devices for better performance
 */

import { isLowEndDevice, isSlowNetwork } from './performance';

/**
 * Get image quality based on device capabilities
 * Lower quality for low-end devices to save bandwidth
 */
export function getAdaptiveImageQuality(): number {
    if (isLowEndDevice()) {
        return 60; // Lower quality for low-end devices
    }

    if (isSlowNetwork()) {
        return 70; // Medium quality for slow networks
    }

    return 80; // High quality for good devices
}

/**
 * Get number of items to load per page
 * Fewer items for low-end devices
 */
export function getAdaptivePageSize(defaultSize: number = 12): number {
    if (isLowEndDevice()) {
        return Math.floor(defaultSize / 2); // Half for low-end
    }

    return defaultSize;
}

/**
 * Should enable animations?
 * Disable on low-end devices for better performance
 */
export function shouldEnableAnimations(): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
        return false;
    }

    // Disable on low-end devices
    if (isLowEndDevice()) {
        return false;
    }

    return true;
}

/**
 * Should lazy load images?
 * More aggressive on low-end devices
 */
export function getImageLoadingStrategy(): 'lazy' | 'eager' {
    if (isLowEndDevice()) {
        return 'lazy'; // Always lazy on low-end
    }

    return 'lazy'; // Default to lazy for all
}

/**
 * Get video quality
 * Lower resolution for low-end devices
 */
export function getAdaptiveVideoQuality(): '360p' | '720p' | '1080p' {
    if (isLowEndDevice()) {
        return '360p';
    }

    if (isSlowNetwork()) {
        return '720p';
    }

    return '1080p';
}
