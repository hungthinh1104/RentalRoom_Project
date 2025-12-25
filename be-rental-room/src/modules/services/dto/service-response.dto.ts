import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ServiceResponseDto {
  @Expose()
  id: string;

  @Expose()
  propertyId: string;

  @Expose()
  serviceName: string;

  @Expose()
  serviceType: string;

  @Expose()
  billingMethod: string;

  @Expose()
  unitPrice: number;

  @Expose()
  unit?: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
