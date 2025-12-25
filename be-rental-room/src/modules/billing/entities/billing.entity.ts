export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum ItemType {
  RENT = 'RENT',
  UTILITY = 'UTILITY',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export class Invoice {
  id: string;
  contractId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: InvoiceStatus;
}

export class InvoiceLineItem {
  id: string;
  invoiceId: string;
  serviceId?: string;
  itemType: ItemType;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
