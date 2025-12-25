import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { UserRole } from '../entities';

export class FilterUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'createdAt' | 'fullName' | 'email'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  search?: string; // Search in fullName, email
}
