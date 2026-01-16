export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
};

/**
 * Uses semantic colors from globals.css for theming consistency
 */
export const TAX_COLORS = {
    // Orange/Warning for Taxable
    TAXABLE: 'bg-warning-light text-warning-foreground border-warning/20',
    // Teal/Success for Non-Taxable
    NON_TAXABLE: 'bg-success-light text-success-foreground border-success/20',
    // Neutral for Conditional
    CONDITIONAL: 'bg-muted text-muted-foreground border-border',

    WARNING: {
        // Green
        SAFE: 'text-success bg-success-light border-success/20',
        // Orange
        WARNING: 'text-warning bg-warning-light border-warning/20',
        // Red
        DANGER: 'text-destructive bg-destructive-light border-destructive/20',
    }
} as const;

export const getTaxCategoryColor = (category: string) => {
    return TAX_COLORS[category as keyof typeof TAX_COLORS] || TAX_COLORS.CONDITIONAL;
};

export const getWarningLevelColor = (level: string) => {
    return TAX_COLORS.WARNING[level as keyof typeof TAX_COLORS.WARNING] || TAX_COLORS.WARNING.SAFE;
};
