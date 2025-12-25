import { Exclude, Expose, Type } from 'class-transformer';
import { RoomStatus } from '../entities';

@Exclude()
class PropertyBasicDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  ward: string;
}

@Exclude()
export class RoomResponseDto {
  @Expose()
  id: string;

  @Expose()
  propertyId: string;

  @Expose()
  roomNumber: string;

  @Expose()
  area: number;

  @Expose()
  pricePerMonth: number;

  @Expose()
  deposit: number;

  @Expose()
  status: RoomStatus;

  @Expose()
  description?: string;

  @Expose()
  maxOccupants?: number;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  // Optional: Include related property info
  @Expose()
  @Type(() => PropertyBasicDto)
  property?: PropertyBasicDto;
}
