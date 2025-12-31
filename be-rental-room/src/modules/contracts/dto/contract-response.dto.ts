import { Exclude, Expose, Transform, Type } from 'class-transformer';

@Exclude()
export class ContractUserDto {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;
}

@Exclude()
export class ContractRelatedTenantDto {
  @Expose()
  userId: string;

  @Expose()
  citizenId: string;

  @Expose()
  @Type(() => ContractUserDto)
  user: ContractUserDto;
}

@Exclude()
export class ContractRelatedLandlordDto {
  @Expose()
  userId: string;

  @Expose()
  bankName: string;

  @Expose()
  bankAccount: string;

  @Expose()
  @Type(() => ContractUserDto)
  user: ContractUserDto;
}

@Exclude()
export class ContractRelatedPropertyDto {
  @Expose()
  address: string;

  @Expose()
  name: string;

  @Expose()
  propertyType: string;
}

@Exclude()
export class ContractRelatedRoomDto {
  @Expose()
  id: string;

  @Expose()
  roomNumber: string;

  @Expose()
  area: number;

  @Expose()
  @Type(() => ContractRelatedPropertyDto)
  property: ContractRelatedPropertyDto;
}

@Exclude()
export class ContractRelatedInvoiceDto {
  @Expose()
  id: string;

  @Expose()
  invoiceNumber: string;

  @Expose()
  status: string;

  @Expose()
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : 0;
  })
  totalAmount: number;

  @Expose()
  billingMonth: number;

  @Expose()
  billingYear: number;

  @Expose()
  dueDate: Date;

  @Expose()
  createdAt: Date;
}

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
  deposit: number;

  @Expose()
  @Type(() => ContractRelatedRoomDto)
  room: ContractRelatedRoomDto;

  @Expose()
  @Type(() => ContractRelatedTenantDto)
  tenant: ContractRelatedTenantDto;

  @Expose()
  @Type(() => ContractRelatedLandlordDto)
  landlord: ContractRelatedLandlordDto;

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
  paymentRef?: string;

  @Expose()
  depositDeadline?: Date;

  @Expose()
  lastNegotiationNote?: string;

  @Expose()
  @Expose()
  @Type(() => ContractResidentResponseDto)
  residents?: ContractResidentResponseDto[];

  @Expose()
  @Type(() => ContractRelatedInvoiceDto)
  invoices?: ContractRelatedInvoiceDto[];
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
