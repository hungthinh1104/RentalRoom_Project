/**
 * Lazy loaded components with dynamic imports
 * Reduces initial bundle size
 */

import dynamic from 'next/dynamic';
import { PageLoader, FormLoader } from '@/components/ui/loading';

/**
 * Heavy components that should be lazy loaded
 * Only load when needed to reduce initial bundle
 */

// Removed missing components - chart, pdf, gallery, map, calendar components not available
// Only keeping components that exist

export {};

