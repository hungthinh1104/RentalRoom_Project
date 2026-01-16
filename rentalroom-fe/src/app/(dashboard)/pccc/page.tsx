'use client';

import React from 'react';
import { PCCCForm } from '@/features/pccc/components/PCCCForm';

export default function PCCCCheckPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Thẩm Định & Cấp Phép PCCC</h1>
                    <p className="text-gray-500 mt-1">Hệ thống đánh giá an toàn cháy nổ và lập hồ sơ tự động (PC17, PC19).</p>
                </div>
            </div>

            <div className="border-t border-gray-100 py-6">
                <PCCCForm />
            </div>
        </div>
    );
}
