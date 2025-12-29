import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyToReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reply: string;
}
