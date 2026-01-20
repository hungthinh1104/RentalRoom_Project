import api from '@/lib/api/client';
import { PaginationParams, PaginatedResponse } from '@/types';

export enum ServiceType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  PARKING = 'PARKING',
  CLEANING = 'CLEANING',
}

export enum BillingMethod {
  FIXED = 'FIXED',
  METERED = 'METERED',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface Service {
  id: string;
  propertyId: string;
  serviceName: string;
  serviceType: ServiceType;
  billingMethod: BillingMethod;
  unitPrice: number;
  unit: string;
}

export interface MeterReading {
  id: string;
  serviceId: string;
  contractId: string;
  month: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  service?: Service;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  serviceId?: string;
  itemType: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  service?: Service;
}

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  contractId: string;
  tenantId: string;
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  totalAmount: number;
  status: InvoiceStatus;
  paidAmount?: number;
  tenant?: {
    id: string;
    user?: {
      fullName: string;
    };
  };
  contract?: {
    id: string;
    landlord?: {
      id: string;
      user?: {
        fullName: string;
      };
    };
    tenant?: {
      id: string;
      user?: {
        fullName: string;
      };
    };
    room?: {
      roomNumber: string;
      property?: {
        propertyName: string;
      };
    };
  };
  lineItems?: InvoiceLineItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitMeterReadingDto {
  contractId: string;
  month: string;
  readings: Array<{
    serviceId: string;
    currentReading: number;
  }>;
}

export interface MeterReadingResponse {
  contractId: string;
  month: string;
  readings: MeterReading[];
  totalAmount: number;
}

export interface TenantUtilityBilling {
  contract: {
    id: string;
    contractNumber?: string;
    tenantId?: string;
  };
  services: Service[];
  latestReadings: MeterReading[];
  totalAmount: number;
}

export const utilitiesApi = {
  // Meter readings
  submitMeterReadings: async (
    dto: SubmitMeterReadingDto,
  ): Promise<MeterReadingResponse> => {
    const { data } = await api.post<MeterReadingResponse>(
      '/billing/meter-readings',
      dto,
    );
    return data;
  },

  getMeterReadings: async (
    contractId: string,
    month?: string,
  ): Promise<MeterReading[]> => {
    const params = month ? { month } : {};
    const { data } = await api.get<MeterReading[]>(
      `/billing/meter-readings/${contractId}`,
      { params },
    );
    return data;
  },

  getTenantUtilityBilling: async (month: string): Promise<TenantUtilityBilling> => {
    const { data } = await api.get<TenantUtilityBilling>(
      '/billing/tenant/utilities',
      { params: { month } },
    );
    return data;
  },

  getTenantLastReadings: async (): Promise<MeterReading[]> => {
    const { data } = await api.get<MeterReading[]>(
      '/billing/tenant/last-readings',
    );
    return data;
  },

  // Invoice management
  generateUtilityInvoice: async (
    contractId: string,
    month: string,
    options?: {
      readings?: Array<{ serviceId: string; currentReading: number }>;
      includeRent?: boolean;
      includeFixedServices?: boolean;
    },
  ): Promise<{ invoice: Invoice; readings: MeterReading[]; totalAmount: number }> => {
    const { data } = await api.post<{ invoice: Invoice; readings: MeterReading[]; totalAmount: number }>(
      `/billing/utilities/invoice/${contractId}/${month}`,
      options,
    );
    return data;
  },

  getUtilityInvoices: async (month?: string): Promise<Invoice[]> => {
    const params = month ? { month } : {};
    const { data } = await api.get<Invoice[]>(
      '/billing/utilities/invoices',
      { params },
    );
    return data;
  },

  getUtilityInvoice: async (invoiceId: string): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(
      `/billing/invoices/${invoiceId}`,
    );
    return data;
  },

  // Payment
  recordUtilityPayment: async (
    invoiceId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<{ payment: Payment; invoice: Invoice }> => {
    const { data } = await api.post<{ payment: Payment; invoice: Invoice }>(
      `/billing/utilities/invoices/${invoiceId}/pay`,
      { amount, paymentMethod },
    );
    return data;
  },
};

export const billingApi = utilitiesApi;

