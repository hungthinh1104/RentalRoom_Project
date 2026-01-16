import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { ApplicationStatus } from '../entities';

export class FilterRentalApplicationsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'applicationDate' | 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  landlordId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  search?: string; // Search in message
}
