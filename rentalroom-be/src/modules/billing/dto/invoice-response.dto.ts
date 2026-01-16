import { Exclude, Expose, Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
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
