import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { PaginationDto } from 'src/shared/dtos';
import { NotificationType } from '../entities';

export class FilterNotificationsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string; // 'sentAt' | 'createdAt'

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Search in title, content
}
