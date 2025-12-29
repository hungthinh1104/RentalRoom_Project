import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';
import { RoomStatus, AmenityType } from '../entities';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsNumber()
  area: number;

  @IsNumber()
  pricePerMonth: number;

  @IsNumber()
  deposit: number;

  @IsEnum(RoomStatus)
  status: RoomStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  maxOccupants?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsEnum(AmenityType, { each: true })
  @IsOptional()
  amenities?: AmenityType[];
}
