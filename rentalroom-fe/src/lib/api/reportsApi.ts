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

export interface CashFlowAlert {
  type: 'overdue' | 'upcoming' | 'forecast' | 'success';
  severity: 'high' | 'medium' | 'low';
  invoiceId?: string;
  roomNumber?: string;
  amount?: number;
  days?: number;
  message: string;
}

export interface CashFlowSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  totalExpected: number;
  totalPending: number;
  totalOverdue: number;
  balance: number;
  alerts: CashFlowAlert[];
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

export const reportsApi = {
  getLandlordSummary: async (landlordId: string) => {
    const { data } = await api.get<LandlordDashboardSummary>(
      '/reports/landlord/summary',
      { params: { landlordId } },
    );
    return data;
  },

  getCashFlowSummary: async (month?: string) => {
    const { data } = await api.get<CashFlowSummary>('/dashboard/cash-flow', {
      params: { month },
    });
    return data;
  },
};
