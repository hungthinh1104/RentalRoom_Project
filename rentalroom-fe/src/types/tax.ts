export enum TaxCategory {
    TAXABLE = 'TAXABLE',
    NON_TAXABLE = 'NON_TAXABLE',
    CONDITIONAL = 'CONDITIONAL',
}

export enum IncomeType {
    RENTAL = 'RENTAL',
    DEPOSIT = 'DEPOSIT',
    PENALTY = 'PENALTY',
    OTHER = 'OTHER',
}

export enum ExpenseType {
    ELECTRICITY = 'ELECTRICITY',
    WATER = 'WATER',
    MAINTENANCE = 'MAINTENANCE',
    TAX_PAID = 'TAX_PAID',
    INSURANCE = 'INSURANCE',
    OTHER = 'OTHER',
}

export interface Income {
    id: string;
    rentalUnitId: string;
    amount: number; // Stored as string in JSON/Prisma Decimal, use number for FE if safe
    incomeType: IncomeType;
    taxCategory: TaxCategory;
    periodYear: number;
    periodMonth: number;
    periodMonthStr: string;
    receivedAt: string;
    paymentMethod: string;
    receiptNumber?: string;
    note?: string;
    snapshotId: string;
    createdAt: string;
}

export interface ProjectionResponse {
    year: number;
    totalSoFar: number;
    threshold: number;
    percent: number;
    warningLevel: 'SAFE' | 'WARNING' | 'DANGER';
    disclaimer: string;
    message: string;
}

export interface TaxYearSummary {
    year: number;
    totalIncome: number;
    taxableIncome: number;
    nonTaxableIncome: number;
    threshold: number;
    status: string;
    isFrozen: boolean;
    disclaimer: string;
    note: string;
}

export interface CreateIncomePayload {
    rentalUnitId: string;
    tenantId?: string;
    amount: number;
    incomeType: IncomeType;
    receivedAt: string;
    paymentMethod: string;
    note?: string;
    receiptNumber?: string;
}
