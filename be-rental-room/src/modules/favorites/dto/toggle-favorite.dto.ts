import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
    @ApiProperty({ description: 'The ID of the room to toggle favorite status' })
    @IsUUID()
    @IsNotEmpty()
    roomId: string;
}
