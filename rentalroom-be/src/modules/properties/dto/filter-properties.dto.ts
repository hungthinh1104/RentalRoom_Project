import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { PropertyType } from '../entities';

export class FilterPropertiesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'createdAt' | 'name'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  landlordId?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in name, address
}
