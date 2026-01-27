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
            <div className="animate-pulse bg-muted rounded-xl p-6 text-center">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mx-auto mb-4"></div>
                <div className="h-12 w-12 bg-muted-foreground/20 rounded-full mx-auto"></div>
            </div>
        );
    }

    const getColor = () => {
        if (score >= 90) return 'text-success bg-success/5 border-success/20';
        if (score >= 60) return 'text-warning bg-warning/5 border-warning/20';
        return 'text-destructive bg-destructive/5 border-destructive/20';
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
                <p className="mt-4 text-xs text-destructive/80 max-w-xs mx-auto">
                    Phát hiện rủi ro nghiêm trọng. Vui lòng khắc phục &quot;Chuồng cọp&quot; hoặc mở lối thoát hiểm thứ 2.
                </p>
            )}
        </div>
    );
};
