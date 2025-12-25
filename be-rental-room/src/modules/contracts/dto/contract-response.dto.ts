import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ContractResponseDto {
  @Expose()
  id: string;

  @Expose()
  contractNumber: string;

  @Expose()
  tenantId: string;

  @Expose()
  landlordId: string;

  @Expose()
  roomId: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  monthlyRent: number;

  @Expose()
  depositAmount: number;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  signedAt?: Date;

  @Expose()
  terminatedAt?: Date;
}
