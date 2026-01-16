import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceStatus,
} from '../entities';

export class CreateMaintenanceRequestDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @IsEnum(MaintenanceCategory)
  @IsNotEmpty()
  category: MaintenanceCategory;

  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @IsDateString()
  @IsOptional()
  requestDate?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;
}
