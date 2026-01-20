import { Metadata } from 'next';
import HomePage from './home-page';

export const metadata: Metadata = {
    title: 'RentalRoom - Nền tảng Quản lý Cho thuê Thông minh',
    description: 'Quản lý tài sản cho thuê với AI. Tiết kiệm 40% thời gian, tăng 30% doanh thu. Được tin dùng bởi 5,000+ chủ nhà tại Việt Nam. Dùng thử miễn phí 14 ngày.',
    keywords: ['property management vietnam', 'rental management software', 'AI property search', 'quản lý tài sản', 'phần mềm quản lý trọ'],
    openGraph: {
        title: 'RentalRoom - AI-Powered Property Management Platform',
        description: 'Enterprise property management software for Vietnam. Save 40% admin time, increase 30% revenue.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'RentalRoom Property Management Platform',
            },
        ],
        locale: 'vi_VN',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'RentalRoom - Quản lý Cho thuê Thông minh',
        description: 'Tiết kiệm 40% thời gian quản lý với AI',
        images: ['/og-image.png'],
    },
    alternates: {
        canonical: 'https://diphungthinh.io.vn',
    },
};

export default HomePage;
