'use client';

import React from 'react';
import { PCCCReport } from '../types/pccc.types';

interface PDFDownloadCardProps {
    report: PCCCReport;
    onDownload: (type: 'PC17' | 'PC19' | 'CHECKLIST') => void;
}

export const PDFDownloadCard: React.FC<PDFDownloadCardProps> = ({ report, onDownload }) => {
    const isExpired = new Date(report.expiryDate) < new Date();

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Hồ Sơ PCCC</h3>
                    <p className="text-sm text-gray-500">Mã: {report.id.substring(0, 8)}...</p>
                </div>
                {report.qrCode && (
                    <img src={report.qrCode} alt="QR Code" className="w-16 h-16" />
                )}
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => onDownload('PC17')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                    <span>📄 Phương Án PCCC (PC17)</span>
                    <span className="text-xs bg-blue-200 px-2 py-1 rounded">Official</span>
                </button>

                <button
                    onClick={() => onDownload('PC19')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                    <span>📝 Đơn Đề Nghị (PC19)</span>
                    <span className="text-xs bg-indigo-200 px-2 py-1 rounded">Sign</span>
                </button>

                <button
                    onClick={() => onDownload('CHECKLIST')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                    <span>✅ Bảng Kiểm Tra (Checklist)</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Print</span>
                </button>
            </div>

            {report.pdfHash && (
                <div className="mt-4 py-2 px-3 bg-slate-50 rounded-md border border-slate-100">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                        Digital Signature (SHA-256)
                    </div>
                    <div className="font-mono text-[10px] text-slate-600 break-all select-all">
                        {report.pdfHash}
                    </div>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Trạng thái:</span>
                <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpired ? 'ĐÃ HẾT HẠN' : 'CÒN HIỆU LỰC'}
                </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Hết hạn:</span>
                <span className="font-medium text-gray-900">
                    {new Date(report.expiryDate).toLocaleDateString('vi-VN')}
                </span>
            </div>
        </div>
    );
};
