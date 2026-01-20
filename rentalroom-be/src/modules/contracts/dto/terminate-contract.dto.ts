import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TerminationDeductionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

// Added TerminationType enum
export enum TerminationType {
  EARLY_BY_TENANT = 'EARLY_BY_TENANT',
  EARLY_BY_LANDLORD = 'EARLY_BY_LANDLORD',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  EXPIRY = 'EXPIRY',
  EVICTION = 'EVICTION',
  OTHER = 'OTHER',
}

export class TerminateContractDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty()
  @IsDateString()
  terminationDate: string;

  // Added terminationType
  @ApiProperty({ enum: TerminationType })
  @IsEnum(TerminationType)
  @IsNotEmpty()
  terminationType: TerminationType;

  @ApiProperty({ type: [TerminationDeductionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminationDeductionDto)
  deductions?: TerminationDeductionDto[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  returnDeposit?: boolean;

  // Added refundAmount
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  noticeDays?: number;
}
