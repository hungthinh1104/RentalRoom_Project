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
    landlordId?: string; // Added
    propertyType: PropertyType; // Added
    floors: number; // Added
    area: number; // Added
    volume?: number; // Added
    laneWidth?: number; // Added
    hasCage: boolean; // Added
    requirements: PCCCRequirements;
    complianceScore: number;
    status: PCCCStatus;
    pdfUrl?: string; // PC17
    pc19Url?: string; // Kept for compat, check if in schema? Schema has pdfUrl, qrCode. pc19Url might be derived or FE only?
    checklistUrl?: string;
    pdfHash?: string;
    qrCode?: string;
    expiryDate: string;
    createdAt: string;
    updatedAt?: string; // Added
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
