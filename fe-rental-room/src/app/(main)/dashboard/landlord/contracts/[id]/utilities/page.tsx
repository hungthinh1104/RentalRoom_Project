'use client';

import { useParams } from 'next/navigation';
import { UtilitiesDashboardPage } from '@/features/utilities/pages/utilities-dashboard-page';

export default function Page() {
    const params = useParams();
    const contractId = params.id as string;

    if (!contractId) {
        return <div className="text-center py-8">Không tìm thấy hợp đồng</div>;
    }

    return <UtilitiesDashboardPage contractId={contractId} />;
}
