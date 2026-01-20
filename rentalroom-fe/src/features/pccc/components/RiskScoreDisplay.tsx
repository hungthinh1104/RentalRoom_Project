'use client';

import React from 'react';

interface RiskScoreDisplayProps {
    score: number;
    status: 'PASS' | 'WARNING' | 'FAIL' | 'PENDING';
    loading?: boolean;
}

export const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({ score, status, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 rounded-xl p-6 text-center">
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
            </div>
        );
    }

    const getColor = () => {
        if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getStatusText = () => {
        if (score >= 90) return 'ĐẠT CHUẨN (PASS)';
        if (score >= 60) return 'CẢNH BÁO (WARNING)';
        return 'KHÔNG ĐẠT (FAIL)';
    };

    return (
        <div className={`border-2 rounded-xl p-6 text-center transition-all ${getColor()}`}>
            <h3 className="text-lg font-semibold mb-2">Điểm An Toàn PCCC</h3>
            <div className="text-5xl font-bold mb-2">{score}/100</div>
            <div className="text-sm font-medium uppercase tracking-wide">
                {getStatusText()}
            </div>
            {status === 'FAIL' && (
                <p className="mt-4 text-xs text-red-700 max-w-xs mx-auto">
                    Phát hiện rủi ro nghiêm trọng. Vui lòng khắc phục &quot;Chuồng cọp&quot; hoặc mở lối thoát hiểm thứ 2.
                </p>
            )}
        </div>
    );
};
