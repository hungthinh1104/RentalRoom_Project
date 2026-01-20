'use client';

import React, { useState, useEffect } from 'react';
import { usePCCCReport } from '../hooks/usePCCCReport';
import { CreatePCCCReportDto, PropertyType } from '../types/pccc.types';
import { LiabilityWaiverModal } from './LiabilityWaiverModal';
import { RiskScoreDisplay } from './RiskScoreDisplay';
import { PDFDownloadCard } from './PDFDownloadCard';
import api from '@/lib/api/client';

export const PCCCForm = () => {
    const { generateReport, report, loading, error, downloadPDF } = usePCCCReport();
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [showWaiverModal, setShowWaiverModal] = useState(false);

    // Form State
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [formData, setFormData] = useState<CreatePCCCReportDto>({
        propertyType: 'NHA_TRO',
        floors: 1,
        area: 50,
        volume: 0,
        laneWidth: 5,
        hasCage: false,
        scenarioType: 'ELECTRICAL_FIRE',
    });

    // Mock Risk Score Calculation (Client-side preview)
    const calculateRiskPreview = () => {
        let score = 100;
        if (formData.hasCage) score -= 50;
        if (formData.laneWidth && formData.laneWidth < 2) score -= 40;
        else if (formData.laneWidth && formData.laneWidth < 3.5) score -= 10;
        // ... more rules
        return Math.max(0, score);
    };

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await api.get<{ data: { id: string; name: string }[] }>('/properties');
                const data = res.data;
                // Standardize handling of potentially nested or flat data from API
                if (Array.isArray(data)) {
                    setProperties(data);
                } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
                    setProperties((data as any).data);
                } else {
                    console.warn("Unexpected properties API response format", data);
                }
            } catch (e) {
                console.error("Failed to fetch properties", e);
            }
        };
        fetchProperties();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPropertyId) return alert('Vui lòng chọn bất động sản');

        // Open waiver modal
        setShowWaiverModal(true);
    };

    const handleWaiverAgreed = async () => {
        try {
            await generateReport(selectedPropertyId, formData);
        } catch (err) {
            // Error handled by hook
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LiabilityWaiverModal
                open={showWaiverModal}
                onOpenChange={setShowWaiverModal}
                onAgree={handleWaiverAgreed}
            />

            {/* Left Column: Form */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Thông Tin Bất Động Sản</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Property Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Nhà Trọ</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                required
                            >
                                <option value="">-- Chọn bất động sản --</option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Property Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại Hình</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['NHA_TRO', 'CHUNG_CU_MINI', 'KINH_DOANH'] as PropertyType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, propertyType: type })}
                                        className={`p-2 text-sm rounded-lg border ${formData.propertyType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                                    >
                                        {type === 'NHA_TRO' ? 'Nhà Trọ' : type === 'CHUNG_CU_MINI' ? 'Chung Cư Mini' : 'Kinh Doanh'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Floors & Area */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số Tầng</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.floors}
                                    onChange={(e) => setFormData({ ...formData, floors: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diện Tích (m²)</label>
                                <input
                                    type="number"
                                    min={10}
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.area}
                                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Lane Width */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Độ Rộng Ngõ (m)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="w-full p-2 border rounded-lg"
                                value={formData.laneWidth}
                                onChange={(e) => setFormData({ ...formData, laneWidth: Number(e.target.value) })}
                            />
                            {formData.laneWidth && formData.laneWidth < 3.5 && (
                                <p className="text-xs text-orange-500 mt-1">⚠️ Ngõ nhỏ hơn 3.5m yêu cầu trang bị xe đẩy chữa cháy.</p>
                            )}
                        </div>

                        {/* Tiger Cage & Scenario */}
                        <div className="pt-2">
                            <label className="flex items-center space-x-3 p-3 border border-red-100 bg-red-50 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.hasCage}
                                    onChange={(e) => setFormData({ ...formData, hasCage: e.target.checked })}
                                    className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                                />
                                <span className="text-sm font-medium text-red-900">Nhà có &quot;Chuồng Cọp&quot; (Không lối thoát)</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giả Định Tình Huống</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={formData.scenarioType}
                                onChange={(e) => setFormData({ ...formData, scenarioType: e.target.value as CreatePCCCReportDto['scenarioType'] })}
                            >
                                <option value="ELECTRICAL_FIRE">Cháy do chập điện</option>
                                <option value="GAS_LEAK">Rò rỉ khí Gas</option>
                                <option value="GENERAL_FIRE">Cháy thông thường</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}`}
                        >
                            {loading ? 'Đang Xử Lý...' : 'Tạo Hồ Sơ PCCC'}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Right Column: Results */}
            <div className="space-y-6">
                <RiskScoreDisplay
                    score={report ? report.complianceScore : calculateRiskPreview()}
                    status={report ? (report.complianceScore >= 90 ? 'PASS' : report.complianceScore >= 60 ? 'WARNING' : 'FAIL') : 'PENDING'}
                    loading={loading}
                />

                {report && (
                    <div className="animate-fade-in-up">
                        <PDFDownloadCard
                            report={report}
                            onDownload={(type) => downloadPDF(report.id, type)}
                        />
                    </div>
                )}

                {!report && (
                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-400">
                        <div className="text-4xl mb-2">📄</div>
                        <p>Điền thông tin và nhấn &quot;Tạo Hồ Sơ&quot; để xem kết quả</p>
                    </div>
                )}
            </div>
        </div>
    );
};
