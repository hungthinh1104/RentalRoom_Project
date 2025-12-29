import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus } from '../entities';

export class CreateContractResidentDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  citizenId?: string;

  @IsString()
  @IsOptional()
  relationship?: string;
}

export class CreateContractDto {
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  landlordId: string;

  @IsString()
  @IsOptional()
  contractNumber?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  monthlyRent: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  deposit: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  paymentDay?: number;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxOccupants?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContractResidentDto)
  residents?: CreateContractResidentDto[];

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsString()
  @IsOptional()
  eSignatureUrl?: string;
}
