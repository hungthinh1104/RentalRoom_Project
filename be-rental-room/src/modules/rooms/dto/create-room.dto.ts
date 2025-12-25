import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { RoomStatus } from '../entities/room.entity';

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
}
