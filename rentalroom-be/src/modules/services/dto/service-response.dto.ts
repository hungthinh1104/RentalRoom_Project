import { Exclude, Expose, Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : null;
  })
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
