export enum ContractType {
    RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
    DEPOSIT_RECEIPT = 'DEPOSIT_RECEIPT',
    HANDOVER_CHECKLIST = 'HANDOVER_CHECKLIST',
    SERVICE_AGREEMENT = 'SERVICE_AGREEMENT',
    LIQUIDATION_MINUTES = 'LIQUIDATION_MINUTES',
}

export interface ContractTemplate {
    id: string;
    type: ContractType;
    name: string;
    title: string;
    content: string;
    version: number;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
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
