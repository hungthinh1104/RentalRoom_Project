import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { NotificationType } from '../entities';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType: NotificationType;

  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsDateString()
  @IsOptional()
  sentAt?: string;
}
