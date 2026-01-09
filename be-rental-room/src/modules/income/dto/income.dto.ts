import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { IncomeType, PaymentMethod } from '@prisma/client';

export class CreateIncomeDto {
  @ApiProperty({ description: 'Rental unit ID', example: 'uuid' })
  @IsUUID()
  rentalUnitId: string;

  @ApiPropertyOptional({ description: 'Tenant ID (optional)', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ description: 'Amount received (VND)', example: 5000000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Income type',
    enum: IncomeType,
    example: IncomeType.RENTAL,
  })
  @IsEnum(IncomeType)
  incomeType: IncomeType;

  @ApiProperty({
    description: 'Date when money was received (ISO format)',
    example: '2026-01-15T10:30:00Z',
  })
  @IsDateString()
  receivedAt: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Receipt/Invoice number',
    example: 'INV-2026-01-001',
  })
  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class YearProjectionResponseDto {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 45000000, description: 'Total so far (VND)' })
  totalSoFar: number;

  @ApiProperty({ example: 500000000, description: 'Reference threshold (VND)' })
  threshold: number;

  @ApiProperty({ example: 9, description: 'Percentage of threshold' })
  percent: number;

  @ApiProperty({
    example: 'SAFE',
    enum: ['SAFE', 'WARNING', 'DANGER'],
    description: 'Warning level',
  })
  warningLevel: string;

  @ApiProperty({
    example: '⚠️ Số liệu tham khảo - không thay thế tư vấn thuế',
  })
  disclaimer: string;

  @ApiProperty({
    example: '✅ Thu nhập 9% ngưỡng - an toàn',
  })
  message: string;
}
