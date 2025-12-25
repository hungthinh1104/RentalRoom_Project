import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class InvoiceResponseDto {
  @Expose()
  id: string;

  @Expose()
  invoiceNumber: string;

  @Expose()
  contractId: string;

  @Expose()
  tenantId: string;

  @Expose()
  issueDate: Date;

  @Expose()
  dueDate: Date;

  @Expose()
  totalAmount: number;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  paidAt?: Date;

  // Optional aggregated field
  @Expose()
  lineItemCount?: number;
}
