import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChangeType } from '@prisma/client';
import { PaginationDto } from 'src/shared/dtos';

export class FilterChangeLogDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(ChangeType)
  changeType?: ChangeType;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
