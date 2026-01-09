import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { DocumentType } from '../entities/legal-document.entity';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsString()
  slug: string; // URL-friendly identifier

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @IsInt()
  @Min(1)
  @IsOptional()
  retentionYears?: number = 10; // Default 10 years (Vietnamese law)
}
