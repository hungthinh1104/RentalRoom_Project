import api from './client';

export interface LandlordDashboardSummary {
  summary: {
    totalProperties: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
    revenueThisMonth: number;
    overdueInvoices: number;
    openMaintenance: number;
  };
  revenueLast6Months: Array<{ year: number; month: number; amount: number }>;
}

export const reportsApi = {
  getLandlordSummary: async (landlordId: string) => {
    const { data } = await api.get<LandlordDashboardSummary>(
      '/reports/landlord/summary',
      { params: { landlordId } },
    );
    return data;
  },
};
