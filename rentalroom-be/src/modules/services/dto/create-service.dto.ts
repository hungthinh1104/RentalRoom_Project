import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ServiceType, BillingMethod } from '../entities';

export class CreateServiceDto {
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType: ServiceType;

  @IsEnum(BillingMethod)
  @IsNotEmpty()
  billingMethod: BillingMethod;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
