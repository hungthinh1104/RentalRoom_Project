import api from '@/lib/api/client';
import { CreateIncomePayload, ProjectionResponse, TaxYearSummary, Income, Expense } from '@/types/tax';

export const taxService = {
    // --- INCOME ---
    createIncome: async (data: CreateIncomePayload): Promise<Income> => {
        const { data: result } = await api.post<Income>('/income', data);
        return result;
    },

    getProjection: async (year: number): Promise<ProjectionResponse> => {
        const { data: result } = await api.get<ProjectionResponse>(`/income/projection/${year}`);
        return result;
    },

    getIncomeList: async (year: number, month?: number): Promise<Income[]> => {
        const params: Record<string, unknown> = { mode: 'list' };
        if (month !== undefined) params.month = month;

        const { data: result } = await api.get<Income[]>(`/income/summary/${year}`, { params });
        return Array.isArray(result) ? result : [];
    },

    deleteIncome: async (id: string, reason: string): Promise<void> => {
        await api.delete(`/income/${id}`, { body: { reason } });
    },

    // --- TAX YEAR ---
    getTaxYearSummary: async (year: number): Promise<TaxYearSummary> => {
        const { data: result } = await api.get<TaxYearSummary>(`/income/tax-year/${year}`);
        return result;
    },

    closeTaxYear: async (year: number): Promise<TaxYearSummary> => {
        const { data: result } = await api.post<TaxYearSummary>(`/income/tax-year/close/${year}`);
        return result;
    },

    exportTaxYear: async (year: number): Promise<string> => {
        const { data: result } = await api.get<string>(`/income/tax-year/${year}/export`, { responseType: 'text' });
        return result;
    },

    // --- EXPENSE ---
    createExpense: async (data: { propertyId: string; categoryId: string; amount: number; description?: string; date: string }): Promise<Expense> => {
        const { data: result } = await api.post<Expense>('/income/expense', data);
        return result;
    },

    deleteExpense: async (id: string): Promise<void> => {
        await api.delete(`/income/expense/${id}`);
    },

    getExpenses: async (year: number): Promise<Expense[]> => {
        const { data: result } = await api.get<Expense[]>(`/income/expense/list/${year}`);
        return Array.isArray(result) ? result : [];
    },

    getExpenseSummary: async (year: number): Promise<Record<string, unknown>> => {
        const { data } = await api.get<Record<string, unknown>>(`/income/expense/summary/${year}`);
        return data;
    },
};
