import api from '@/lib/api/client';
import { CreateIncomePayload, ProjectionResponse, TaxYearSummary } from '@/types/tax';

export const taxService = {
    // --- INCOME ---
    createIncome: async (data: CreateIncomePayload) => {
        const { data: result } = await api.post('/income', data);
        return result;
    },

    getProjection: async (year: number): Promise<ProjectionResponse> => {
        const { data: result } = await api.get<ProjectionResponse>(`/income/projection/${year}`);
        return result;
    },

    getIncomeList: async (year: number, month?: number) => {
        const params: Record<string, unknown> = { mode: 'list' };
        if (month !== undefined) params.month = month;

        const { data: result } = await api.get(`/income/summary/${year}`, { params });
        return Array.isArray(result) ? result : [];
    },

    deleteIncome: async (id: string, reason: string) => {
        const { data: result } = await api.delete(`/income/${id}`, { body: { reason } });
        return result;
    },

    // --- TAX YEAR ---
    getTaxYearSummary: async (year: number): Promise<TaxYearSummary> => {
        const { data: result } = await api.get<TaxYearSummary>(`/income/tax-year/${year}`);
        return result;
    },

    closeTaxYear: async (year: number) => {
        const { data: result } = await api.post(`/income/tax-year/close/${year}`);
        return result;
    },

    exportTaxYear: async (year: number) => {
        const { data: result } = await api.get(`/income/tax-year/${year}/export`, { responseType: 'text' });
        return result;
    },

    // --- EXPENSE ---
    createExpense: async (data: { propertyId: string; categoryId: string; amount: number; description?: string; date: string }) => {
        const { data: result } = await api.post('/income/expense', data);
        return result;
    },

    deleteExpense: async (id: string) => {
        const { data: result } = await api.delete(`/income/expense/${id}`);
        return result;
    },

    getExpenses: async (year: number) => {
        const { data: result } = await api.get(`/income/expense/list/${year}`);
        return Array.isArray(result) ? result : [];
    },

    getExpenseSummary: async (year: number) => {
        const { data: result } = await api.get(`/income/expense/summary/${year}`);
        return result;
    },
};
