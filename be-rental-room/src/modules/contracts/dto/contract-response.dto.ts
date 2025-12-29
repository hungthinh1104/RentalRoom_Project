import { Exclude, Expose, Transform, Type } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
  monthlyRent: number;

  @Expose()
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
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

  @Expose()
  paymentDay?: number;

  @Expose()
  terms?: string;

  @Expose()
  maxOccupants?: number;

  @Expose()
  @Type(() => ContractResidentResponseDto)
  residents?: ContractResidentResponseDto[];
}

@Exclude()
export class ContractResidentResponseDto {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  citizenId?: string;

  @Expose()
  relationship?: string;
}
