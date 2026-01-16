import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { ServiceType, BillingMethod } from '../entities';

export class FilterServicesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'serviceName' | 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsEnum(BillingMethod)
  billingMethod?: BillingMethod;

  @IsOptional()
  @IsString()
  search?: string; // Search in serviceName, description
}
