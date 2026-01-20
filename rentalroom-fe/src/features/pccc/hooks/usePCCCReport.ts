'use client';

import { useState } from 'react';
import api, { ApiError } from '@/lib/api/client'; // Custom api client
import { CreatePCCCReportDto, PCCCReport } from '../types/pccc.types';

export const usePCCCReport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<PCCCReport | null>(null);

    const generateReport = async (propertyId: string, data: CreatePCCCReportDto) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post<PCCCReport>(`/pccc/properties/${propertyId}/report`, data);
            setReport(response.data);
            return response.data;
        } catch (err: unknown) {
            const apiError = err as ApiError;
            const message = apiError.message || 'Có lỗi xảy ra khi tạo báo cáo.';
            setError(message);
            throw apiError;
        } finally {
            setLoading(false);
        }
    };

    const getReport = async (reportId: string) => {
        setLoading(true);
        try {
            const response = await api.get<PCCCReport>(`/pccc/reports/${reportId}`);
            setReport(response.data);
            return response.data;
        } catch (err: unknown) {
            const apiError = err as ApiError;
            setError(apiError.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (reportId: string, type: 'PC17' | 'PC19' | 'CHECKLIST') => {
        try {
            const response = await api.get<Blob>(`/pccc/reports/${reportId}/pdf`, {
                params: { type },
                responseType: 'blob', // Important for file download
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileNameMap = {
                PC17: `PhuongAn_PCCC_${reportId.substring(0, 8)}.pdf`,
                PC19: `DonDeNghi_PCCC_${reportId.substring(0, 8)}.pdf`,
                CHECKLIST: `BangKiemTra_PCCC_${reportId.substring(0, 8)}.pdf`,
            };
            link.setAttribute('download', fileNameMap[type]);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: unknown) {
            console.error('Download failed', err);
            const message = err instanceof Error ? err.message : 'Không thể tải file PDF. Vui lòng thử lại.';
            alert(message);
        }
    };

    return {
        loading,
        error,
        report,
        generateReport,
        getReport,
        downloadPDF,
    };
};
