import { Exclude, Expose, Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : 0;
  })
  pricePerMonth: number;

  @Expose()
  @Transform(({ value }) => {
    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    return value ? Number(value) : 0;
  })
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

  // Review statistics
  @Expose()
  averageRating?: number;

  @Expose()
  reviewCount?: number;

  // Optional: Include related property info
  @Expose()
  @Type(() => PropertyBasicDto)
  property?: PropertyBasicDto;

  @Expose()
  images: string[];

  @Expose()
  amenities: string[];

  @Expose()
  isFavorited?: boolean;
}
