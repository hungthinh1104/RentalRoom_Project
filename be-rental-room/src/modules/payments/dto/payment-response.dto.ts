import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class PaymentResponseDto {
  @Expose()
  id: string;

  @Expose()
  invoiceId: string;

  @Expose()
  tenantId: string;

  @Expose()
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
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
