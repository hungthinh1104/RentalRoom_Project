// Enum synced with Backend
export enum ContractType {
    RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
    DEPOSIT_RECEIPT = 'DEPOSIT_RECEIPT',
    HANDOVER_CHECKLIST = 'HANDOVER_CHECKLIST',
    SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',
    LIQUIDATION_MINUTES = 'LIQUIDATION_MINUTES',
    PCCC_APPLICATION = 'PCCC_APPLICATION', // 🔥 NEW
    PCCC_CHECKLIST = 'PCCC_CHECKLIST', // 🔥 NEW
}

export enum TemplateStatus {
    DRAFT = 'DRAFT',
    REVIEWED = 'REVIEWED',
    ACTIVE = 'ACTIVE',
    DEPRECATED = 'DEPRECATED',
}

export interface ContractTemplate {
    id: string;
    type: ContractType;
    name: string;
    title: string;
    content: string;
    version: number;
    description?: string;
    status: TemplateStatus; // 🔥 NEW
    legalDisclaimer: string; // 🔥 NEW
    pcccPartner?: string; // 🔥 NEW
    isActive: boolean;
    isDefault: boolean;
    reviewedBy?: string; // UUID
    reviewDate?: string; // ISO Date
    createdAt: string;
    updatedAt: string;
}

export interface CreateContractTemplateDto {
    type: ContractType;
    name: string;
    title: string;
    content: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateContractTemplateDto {
    title?: string;
    content?: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
}

export interface ContractHistoryLog {
    id: string;
    action: "CREATE" | "EDIT" | "DELETE" | string;
    oldContent?: string;
    newContent?: string;
    timestamp: string;
    user?: {
        fullName: string;
    };
    admin?: {
        fullName: string;
    };
}
