import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({ description: 'Avatar URL or base64 data', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
