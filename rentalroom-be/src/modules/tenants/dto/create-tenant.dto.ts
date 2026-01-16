import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTenantDto {
  @IsUUID()
  userId: string;

  @IsString()
  fullName: string;

  @IsString()
  phoneNumber: string;

  @IsEmail()
  email: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  citizenId?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMin?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMax?: number;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsString()
  @IsOptional()
  employmentStatus?: string;
}
