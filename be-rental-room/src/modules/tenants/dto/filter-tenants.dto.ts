import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';

export class FilterTenantsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'createdAt' | 'fullName'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in fullName, email, phoneNumber, citizenId
}
