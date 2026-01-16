import api from '@/lib/api/client';

export const reportsApi = {
    // Landlord Reports
    getLandlordExpenses: async (params: { startDate?: string; endDate?: string; landlordId?: string }) => {
        return api.get('/reports/landlord/expenses', { params });
    },

    getLandlordRevenue: async (params: { startDate?: string; endDate?: string; landlordId?: string }) => {
        return api.get('/reports/landlord/revenue', { params });
    },

    getLandlordSummary: async (params: { landlordId?: string }) => {
        return api.get('/reports/landlord/summary', { params });
    },

    getPropertyPerformance: async (params: { landlordId?: string }) => {
        return api.get('/reports/landlord/property-performance', { params });
    },

    // Admin Reports
    getAdminOverview: async () => {
        return api.get('/reports/admin/overview');
    },
};
