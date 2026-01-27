import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { UserDocumentType } from '@prisma/client';

export class CreateUserDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(UserDocumentType)
  type: UserDocumentType;

  @IsNotEmpty()
  @IsUrl()
  fileUrl: string;

  @IsOptional()
  @IsString()
  fileHash?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string; // ISO Date string

  @IsOptional()
  @IsString()
  description?: string;
}
