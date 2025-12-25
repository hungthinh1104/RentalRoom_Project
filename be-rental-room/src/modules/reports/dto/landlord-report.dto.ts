import { IsUUID, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Landlord Revenue Report Query
 */
export class LandlordRevenueQueryDto {
  @ApiProperty({
    description: 'Landlord user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  landlordId: string;

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
    description: 'Property ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

/**
 * DTO for Property Performance Query
 */
export class PropertyPerformanceQueryDto {
  @ApiProperty({
    description: 'Landlord user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  landlordId: string;

  @ApiPropertyOptional({
    description: 'Number of months to look back',
    example: 6,
    default: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  months?: number = 6;
}

/**
 * DTO for Tenant Analytics Query
 */
export class TenantAnalyticsQueryDto {
  @ApiProperty({
    description: 'Landlord user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  landlordId: string;

  @ApiPropertyOptional({
    description: 'Property ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  propertyId?: string;
}

/**
 * Response DTOs
 */
export class MonthlyRevenueDto {
  year: number;
  month: number;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  invoiceCount: number;
  paymentCount: number;
}

export class LandlordRevenueResponseDto {
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    averageMonthlyRevenue: number;
  };
  monthlyBreakdown: MonthlyRevenueDto[];
}

export class PropertyMetricsDto {
  propertyId: string;
  propertyName: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  averageRoomPrice: number;
  maintenanceRequests: number;
}

export class PropertyPerformanceResponseDto {
  properties: PropertyMetricsDto[];
  summary: {
    totalProperties: number;
    averageOccupancy: number;
    totalRevenue: number;
    bestPerformingProperty: {
      id: string;
      name: string;
      occupancyRate: number;
    } | null;
  };
}

export class TenantBehaviorDto {
  tenantId: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  contractStartDate: string;
  totalPayments: number;
  onTimePayments: number;
  latePayments: number;
  averagePaymentDelay: number;
  maintenanceRequests: number;
}

export class TenantAnalyticsResponseDto {
  tenants: TenantBehaviorDto[];
  summary: {
    totalTenants: number;
    averageOnTimeRate: number;
    averagePaymentDelay: number;
    totalMaintenanceRequests: number;
  };
}

/**
 * DTO for Landlord Dashboard Summary (for quick TailAdmin cards)
 */
export class LandlordDashboardSummaryQueryDto {
  @ApiProperty({ description: 'Landlord user ID' })
  @IsUUID()
  landlordId: string;
}

export class LandlordDashboardSummaryResponseDto {
  summary: {
    totalProperties: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
    revenueThisMonth: number;
    overdueInvoices: number;
    openMaintenance: number;
  };
  revenueLast6Months: Array<{ year: number; month: number; amount: number }>;
}
