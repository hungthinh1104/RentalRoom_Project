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

// Rich Text Editor (heavy dependency)
export const LazyRichTextEditor = dynamic(
    () => import('@/components/editor/rich-text-editor').then((mod) => mod.RichTextEditor),
    {
        loading: () => <FormLoader />,
    ssr: false, // Don't render on server
    },
);

// Chart components (heavy charting library)
export const LazyLineChart = dynamic(
    () => import('@/components/charts/line-chart').then((mod) => mod.LineChart),
    {
        loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
    ssr: false,
    },
);

export const LazyBarChart = dynamic(
    () => import('@/components/charts/bar-chart').then((mod) => mod.BarChart),
    {
        loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
    ssr: false,
    },
);

// PDF Viewer (heavy PDF.js library)
export const LazyPDFViewer = dynamic(
    () => import('@/components/pdf-viewer').then((mod) => mod.PDFViewer),
    {
        loading: () => <PageLoader />,
    ssr: false,
    },
);

// Image Gallery (heavy lightbox)
export const LazyImageGallery = dynamic(
    () => import('@/components/image-gallery').then((mod) => mod.ImageGallery),
    {
        loading: () => <div className="grid grid-cols-3 gap-4">
        {
            [1, 2, 3].map((i) => (
                <div key= { i } className = "h-32 animate-pulse bg-gray-200 rounded" />
      ))}
</div>,
ssr: false,
  },
);

// Map component (heavy mapping library)
export const LazyMap = dynamic(
    () => import('@/components/map').then((mod) => mod.Map),
    {
        loading: () => <div className="h-96 animate-pulse bg-gray-200 rounded" />,
    ssr: false,
    },
);

// Calendar component (heavy date picker)
export const LazyCalendar = dynamic(
    () => import('@/components/calendar').then((mod) => mod.Calendar),
    {
        loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
    ssr: false,
    },
);

// Data Table with advanced features (heavy table library)
export const LazyDataTable = dynamic(
    () => import('@/components/data-table').then((mod) => mod.DataTable),
    {
        loading: () => <div className="space-y-2">
        {
            [1, 2, 3, 4, 5].map((i) => (
                <div key= { i } className = "h-16 animate-pulse bg-gray-200 rounded" />
      ))}
</div>,
ssr: false,
  },
);
