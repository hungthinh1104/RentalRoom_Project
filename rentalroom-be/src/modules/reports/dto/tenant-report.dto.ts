import { IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Tenant Payment History Query
 */
export class TenantPaymentHistoryQueryDto {
  @ApiProperty({
    description: 'Tenant user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * DTO for Tenant Expense Tracking Query
 */
export class TenantExpenseQueryDto {
  @ApiProperty({
    description: 'Tenant user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({
    description: 'Number of months to look back',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  months?: number = 12;
}

/**
 * Response DTOs for Tenant Reports
 */
export class PaymentRecordDto {
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  dueDate: string;
  daysLate: number | null;
}

export class TenantPaymentHistoryResponseDto {
  summary: {
    totalPayments: number;
    totalAmount: number;
    onTimePayments: number;
    latePayments: number;
    averagePaymentDelay: number;
  };
  payments: PaymentRecordDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export class MonthlyExpenseDto {
  year: number;
  month: number;
  rent: number;
  utilities: number;
  services: number;
  maintenance: number;
  total: number;
}

export class TenantExpenseResponseDto {
  summary: {
    totalExpenses: number;
    averageMonthly: number;
    highestMonth: {
      year: number;
      month: number;
      amount: number;
    } | null;
  };
  monthlyBreakdown: MonthlyExpenseDto[];
  categoryBreakdown: {
    rent: number;
    utilities: number;
    services: number;
    maintenance: number;
  };
}
