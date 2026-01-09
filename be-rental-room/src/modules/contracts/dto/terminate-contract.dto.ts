import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
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

export class TerminateContractDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty()
  @IsDateString()
  terminationDate: string;

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

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  noticeDays?: number;
}
