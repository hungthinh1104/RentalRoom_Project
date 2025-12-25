import { Exclude, Expose } from 'class-transformer';
import { PropertyType } from '../entities';

@Exclude()
export class PropertyResponseDto {
  @Expose()
  id: string;

  @Expose()
  landlordId: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  cityCode?: string;

  @Expose()
  ward: string;

  @Expose()
  wardCode?: string;

  @Expose()
  propertyType: PropertyType;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  roomCount?: number; // Optional aggregated count
}
