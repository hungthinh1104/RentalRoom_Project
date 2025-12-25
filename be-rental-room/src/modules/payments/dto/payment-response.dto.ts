import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PaymentResponseDto {
  @Expose()
  id: string;

  @Expose()
  invoiceId: string;

  @Expose()
  tenantId: string;

  @Expose()
  amount: number;

  @Expose()
  paymentMethod: string;

  @Expose()
  paymentDate: Date;

  @Expose()
  status: string;

  @Expose()
  transactionId?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  paidAt?: Date;
}
