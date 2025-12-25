export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  
  rooms: {
    all: ['rooms'] as const,
    list: (params?: any) => [...queryKeys.rooms.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.rooms.all, 'detail', id] as const,
  },
  
  properties: {
    all: ['properties'] as const,
    list: (params?: any) => [...queryKeys.properties.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.properties.all, 'detail', id] as const,
  },
  
  contracts: {
    all: ['contracts'] as const,
    list: (params?: any) => [...queryKeys.contracts.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.contracts.all, 'detail', id] as const,
  },
  
  payments: {
    all: ['payments'] as const,
    list: (params?: any) => [...queryKeys.payments.all, 'list', params] as const,
  },
  
  maintenance: {
    all: ['maintenance'] as const,
    list: (params?: any) => [...queryKeys.maintenance.all, 'list', params] as const,
  },
  
  notifications: {
    all: ['notifications'] as const,
    list: (params?: any) => [...queryKeys.notifications.all, 'list', params] as const,
  },
};