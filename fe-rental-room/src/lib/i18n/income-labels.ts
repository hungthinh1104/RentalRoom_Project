/**
 * Vietnamese labels for income/expense related enums
 */

export const INCOME_TYPE_LABELS: Record<string, string> = {
    RENTAL: 'Tiền phòng',
    DEPOSIT: 'Tiền cọc',
    PENALTY: 'Phạt',
    OTHER: 'Khác',
};

export const TAX_CATEGORY_LABELS: Record<string, string> = {
    TAXABLE: 'Chịu thuế',
    NON_TAXABLE: 'Miễn thuế',
    CONDITIONAL: 'Có điều kiện',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
    ELECTRICITY: 'Điện',
    WATER: 'Nước',
    INTERNET: 'WiFi',
    PARKING: 'Đỗ xe',
    CLEANING: 'Vệ sinh',
};

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
    ELECTRICITY: 'Điện',
    WATER: 'Nước',
    MAINTENANCE: 'Bảo trì',
    TAX_PAID: 'Thuế đã nộp',
    INSURANCE: 'Bảo hiểm',
    OTHER: 'Khác',
};

/**
 * Helper function to get label with fallback
 */
export function getIncomeTypeLabel(type: string): string {
    return INCOME_TYPE_LABELS[type] || type;
}

export function getTaxCategoryLabel(category: string): string {
    return TAX_CATEGORY_LABELS[category] || category;
}

export function getServiceTypeLabel(type: string): string {
    return SERVICE_TYPE_LABELS[type] || type;
}

export function getExpenseTypeLabel(type: string): string {
    return EXPENSE_TYPE_LABELS[type] || type;
}
