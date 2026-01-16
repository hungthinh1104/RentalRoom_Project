import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Contract ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  contractId: string;

  @ApiProperty({ description: 'Overall rating (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Cleanliness rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  cleanlinessRating: number;

  @ApiProperty({
    description: 'Location rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  locationRating: number;

  @ApiProperty({ description: 'Value rating (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Great room, nice landlord!',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Array of review image URLs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewImages?: string[];
}

export class ReplyToReviewDto {
  @ApiProperty({ description: 'Landlord reply to review' })
  @IsNotEmpty()
  @IsString()
  reply: string;
}
