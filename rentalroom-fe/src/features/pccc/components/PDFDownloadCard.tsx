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
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Hồ Sơ PCCC</h3>
                    <p className="text-sm text-muted-foreground">Mã: {report.id.substring(0, 8)}...</p>
                </div>
                {report.qrCode && (
                    <img src={report.qrCode} alt="QR Code" className="w-16 h-16" />
                )}
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => onDownload('PC17')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors font-medium"
                >
                    <span>📄 Phương Án PCCC (PC17)</span>
                    <span className="text-xs bg-info/20 px-2 py-1 rounded">Official</span>
                </button>

                <button
                    onClick={() => onDownload('PC19')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-accent-purple/10 text-accent-purple rounded-lg hover:bg-accent-purple/20 transition-colors font-medium"
                >
                    <span>📝 Đơn Đề Nghị (PC19)</span>
                    <span className="text-xs bg-accent-purple/20 px-2 py-1 rounded">Sign</span>
                </button>

                <button
                    onClick={() => onDownload('CHECKLIST')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                    <span>✅ Bảng Kiểm Tra (Checklist)</span>
                    <span className="text-xs bg-background/50 px-2 py-1 rounded">Print</span>
                </button>
            </div>

            {report.pdfHash && (
                <div className="mt-4 py-2 px-3 bg-muted/30 rounded-md border border-border/50">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        Digital Signature (SHA-256)
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground break-all select-all">
                        {report.pdfHash}
                    </div>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className={`font-semibold ${isExpired ? 'text-destructive' : 'text-success'}`}>
                    {isExpired ? 'ĐÃ HẾT HẠN' : 'CÒN HIỆU LỰC'}
                </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Hết hạn:</span>
                <span className="font-medium text-foreground">
                    {new Date(report.expiryDate).toLocaleDateString('vi-VN')}
                </span>
            </div>
        </div>
    );
};
