'use client';

import { useState } from 'react';
import axios from '@/lib/api/client'; // Custom api client
import { CreatePCCCReportDto, PCCCReport } from '../types/pccc.types';

export const usePCCCReport = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<PCCCReport | null>(null);

    const generateReport = async (propertyId: string, data: CreatePCCCReportDto) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post<PCCCReport>(`/pccc/properties/${propertyId}/report`, data);
            setReport(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Có lỗi xảy ra khi tạo báo cáo.';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getReport = async (reportId: string) => {
        setLoading(true);
        try {
            const response = await axios.get<PCCCReport>(`/pccc/reports/${reportId}`);
            setReport(response.data);
            return response.data;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (reportId: string, type: 'PC17' | 'PC19' | 'CHECKLIST') => {
        try {
            const response = await axios.get<Blob>(`/pccc/reports/${reportId}/pdf`, {
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
        } catch (err) {
            console.error('Download failed', err);
            alert('Không thể tải file PDF. Vui lòng thử lại.');
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
