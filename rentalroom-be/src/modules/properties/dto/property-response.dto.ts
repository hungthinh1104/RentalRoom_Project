import { Exclude, Expose, Type } from 'class-transformer';
import { PropertyType } from '../entities';
import { RoomResponseDto } from '../../rooms/dto/room-response.dto';

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
  images: string[];

  @Expose()
  createdAt: Date;

  @Expose()
  totalRooms?: number; // Optional aggregated count

  @Expose()
  @Type(() => RoomResponseDto)
  rooms?: RoomResponseDto[];
}
