import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsNotEmpty } from 'class-validator';
import { CreateRoomDto } from './create-room.dto';

export class BulkCreateRoomDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  @IsNotEmpty()
  rooms: CreateRoomDto[];
}
