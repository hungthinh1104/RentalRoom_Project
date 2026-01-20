export interface InvoiceCalculationInput {
    monthlyRent: number;
    readings: Record<string, { old: string; new: string }>;
    selectedServices: string[]; // Service IDs
    services: Array<{
        id: string;
        serviceType?: string;
        billingMethod?: string;
        unitPrice?: number;
    }>;
}

/**
 * Calculates the estimated total for an invoice based on rent, readings, and selected services.
 * @param input Data required for calculation
 * @returns Total estimated amount
 */
export function calculateInvoiceEstimate(input: InvoiceCalculationInput): number {
    const { monthlyRent, readings, selectedServices, services } = input;
    let total = Number(monthlyRent);

    // Filter services
    const elec = services.find((s) => s.serviceType === 'ELECTRICITY');
    const water = services.find((s) => s.serviceType === 'WATER');
    const fixed = services.filter((s) => s.billingMethod === 'FIXED');

    // 1. Calculate Electricity
    if (elec) {
        const r = readings[elec.id];
        if (r?.new && r?.old) {
            const usage = Number(r.new) - Number(r.old);
            if (usage > 0) {
                total += usage * Number(elec.unitPrice || 0);
            }
        }
    }

    // 2. Calculate Water
    if (water) {
        const r = readings[water.id];
        if (r?.new && r?.old) {
            const usage = Number(r.new) - Number(r.old);
            if (usage > 0) {
                total += usage * Number(water.unitPrice || 0);
            }
        }
    }

    // 3. Calculate Fixed Services
    fixed.forEach((s) => {
        if (selectedServices.includes(s.id)) {
            total += Number(s.unitPrice || 0);
        }
    });

    return total;
}
