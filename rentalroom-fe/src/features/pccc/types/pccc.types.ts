export type PropertyType = 'NHA_TRO' | 'CHUNG_CU_MINI' | 'KINH_DOANH';
export type ScenarioType = 'ELECTRICAL_FIRE' | 'GAS_LEAK' | 'GENERAL_FIRE';
export type PCCCStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'REJECTED';

export interface PCCCRequirements {
    fireExtinguishers: Array<{
        type: string;
        quantity: number;
        unit: string;
    }>;
    fireAlarm: boolean;
    sprinkler: boolean;
    emergencyExit: number;
    escapeLadder: boolean;
    waterSupply: string[];
    signs: string[];
    other: string[];
}

export interface PCCCChecklist {
    id: string;
    reportId: string;
    items: Array<{
        id: string;
        category: string;
        question: string;
        isCompliant: boolean;
        note?: string;
    }>;
    inspectorName?: string;
    inspectionDate: string;
}

export interface PCCCReport {
    id: string;
    propertyId: string;
    requirements: PCCCRequirements;
    complianceScore: number;
    status: PCCCStatus;
    pdfUrl?: string; // PC17
    pc19Url?: string;
    checklistUrl?: string;
    qrCode?: string;
    expiryDate: string;
    createdAt: string;
}

export interface CreatePCCCReportDto {
    propertyType: PropertyType;
    floors: number;
    area: number;
    volume?: number;
    laneWidth?: number;
    hasCage?: boolean;
    scenarioType?: ScenarioType;
}
