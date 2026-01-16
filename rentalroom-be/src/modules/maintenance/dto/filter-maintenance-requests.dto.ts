import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { MaintenanceStatus, MaintenancePriority } from '../entities';

export class FilterMaintenanceRequestsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'requestDate' | 'priority' | 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsUUID()
  landlordId?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in title, description
}
