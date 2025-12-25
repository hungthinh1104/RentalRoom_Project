import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export enum AdminReportPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * DTO for Admin Platform Overview Query
 */
export class AdminOverviewQueryDto {
  @ApiPropertyOptional({
    description: 'Report period',
    enum: AdminReportPeriod,
    example: AdminReportPeriod.MONTHLY,
    default: AdminReportPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(AdminReportPeriod)
  period?: AdminReportPeriod = AdminReportPeriod.MONTHLY;

  @ApiPropertyOptional({
    description: 'Number of periods to look back',
    example: 6,
    default: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  periods?: number = 6;
}

/**
 * DTO for Admin Market Insights Query
 */
export class AdminMarketInsightsQueryDto {
  @ApiPropertyOptional({
    description: 'City to filter by',
    example: 'Ho Chi Minh',
  })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Ward to filter by',
    example: 'Phường Võ Thị Sáu',
  })
  @IsOptional()
  ward?: string;
}

/**
 * DTO for Landlord Rating Query
 */
export class LandlordRatingQueryDto {
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

  @ApiPropertyOptional({
    description: 'Search by landlord name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Response DTOs for Admin Reports
 */

export class PlatformMetricsDto {
  period: string;
  totalUsers: number;
  newTenants: number;
  newLandlords: number;
  activeContracts: number;
  totalRevenue: number;
  averageOccupancy: number;
}

export class AdminOverviewResponseDto {
  summary: {
    totalUsers: number;
    totalTenants: number;
    totalLandlords: number;
    totalProperties: number;
    totalRooms: number;
    activeContracts: number;
    platformRevenue: number;
    averageOccupancy: number;
  };
  trends: PlatformMetricsDto[];
  topPerformers: {
    landlords: Array<{
      landlordId: string;
      name: string;
      properties: number;
      revenue: number;
      occupancyRate: number;
    }>;
    properties: Array<{
      propertyId: string;
      name: string;
      landlord: string;
      occupancyRate: number;
      revenue: number;
    }>;
  };
}

export class MarketPriceDto {
  propertyType: string;
  city: string;
  ward: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  totalListings: number;
  occupancyRate: number;
}

export class PopularSearchDto {
  query: string;
  searchCount: number;
  lastSearched: string;
}

export class AdminMarketInsightsResponseDto {
  priceAnalysis: MarketPriceDto[];
  popularSearches: PopularSearchDto[];
  demandMetrics: {
    totalSearches: number;
    totalApplications: number;
    conversionRate: number;
    averageTimeToBook: number;
  };
  recommendations: string[];
}

export class LandlordRatingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  landlordId: string;

  @ApiProperty()
  landlordName: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalRatings: number;

  @ApiProperty()
  reviewCount: number;
}

export class PaginatedLandlordRatingResponseDto {
  @ApiProperty({ type: [LandlordRatingResponseDto] })
  data: LandlordRatingResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;
}
