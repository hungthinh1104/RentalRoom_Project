/**
 * Generate JSON-LD structured data for legal pages
 * Improves SEO and helps search engines understand the content
 */

interface LegalPageStructuredData {
    title: string;
    description: string;
    datePublished: string;
    dateModified: string;
    author: {
        name: string;
        url?: string;
    };
    publisher: {
        name: string;
        logo?: string;
    };
}

export function generateLegalPageStructuredData(data: LegalPageStructuredData) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        datePublished: data.datePublished,
        dateModified: data.dateModified,
        author: {
            '@type': 'Organization',
            name: data.author.name,
            url: data.author.url,
        },
        publisher: {
            '@type': 'Organization',
            name: data.publisher.name,
            logo: data.publisher.logo
                ? {
                    '@type': 'ImageObject',
                    url: data.publisher.logo,
                }
                : undefined,
        },
        inLanguage: 'vi-VN',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Rental Room',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://rentalroom.vn',
        },
    };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(pageName: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Trang chủ',
                item: process.env.NEXT_PUBLIC_SITE_URL || 'https://rentalroom.vn',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: pageName,
            },
        ],
    };
}
