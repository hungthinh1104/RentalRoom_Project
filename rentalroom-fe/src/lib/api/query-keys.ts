export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },

  rooms: {
    all: ['rooms'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.rooms.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.rooms.all, 'detail', id] as const,
  },

  properties: {
    all: ['properties'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.properties.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.properties.all, 'detail', id] as const,
  },

  contracts: {
    all: ['contracts'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.contracts.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.contracts.all, 'detail', id] as const,
  },

  payments: {
    all: ['payments'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.payments.all, 'list', params] as const,
  },

  maintenance: {
    all: ['maintenance'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.maintenance.all, 'list', params] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.notifications.all, 'list', params] as const,
  },

  reports: {
    all: ['reports'] as const,
    landlord: (landlordId: string) => [...queryKeys.reports.all, 'landlord', landlordId] as const,
    cashFlow: (month?: string) => [...queryKeys.reports.all, 'cashFlow', month] as const,
  },

  feedback: {
    all: ['feedback'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.feedback.all, 'list', params] as const,
  },

  tenant: {
    dashboard: {
      all: ['tenant', 'dashboard'] as const,
      contracts: () => ['tenant', 'dashboard', 'contracts'] as const,
      payments: () => ['tenant', 'dashboard', 'payments'] as const,
      recommendations: () => ['tenant', 'dashboard', 'recommendations'] as const,
      favorites: () => ['tenant', 'dashboard', 'favorites'] as const,
      maintenance: (tenantId: string) => ['tenant', 'dashboard', 'maintenance', tenantId] as const,
      bookings: (tenantId: string) => ['tenant', 'dashboard', 'bookings', tenantId] as const,
    }
  }
};