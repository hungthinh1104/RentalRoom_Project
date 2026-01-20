import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserAiFeedback } from '@prisma/client';

/**
 * DTO for submitting AI feedback
 */
export class SubmitAiFeedbackDto {
  @ApiProperty({
    description: 'The ID of the chat message or interaction being rated',
    example: 'chat_123',
  })
  @IsString()
  @IsNotEmpty()
  interactionId: string;

  @ApiProperty({
    description: 'The user feedback (like/dislike)',
    enum: UserAiFeedback,
    example: UserAiFeedback.HELPFUL,
  })
  @IsEnum(UserAiFeedback)
  feedback: UserAiFeedback;

  @ApiProperty({
    description: 'Optional comment from the user about the feedback',
    required: false,
    example: 'The response was very helpful and accurate.',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Optional rating from 1 to 5',
    required: false,
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

/**
 * DTO for room description analysis endpoint
 */
export class AnalyzeRoomDescriptionDto {
  @ApiProperty({
    description: 'Raw room description text (Vietnamese or English)',
    example:
      'Phòng trọ 25m2, full nội thất, sạch sẽ, gần trường ĐH, có wifi, giá 3 triệu',
  })
  @IsString()
  description: string;
}

/**
 * Response DTO for room analysis
 */
export class RoomAnalysisResponseDto {
  @ApiProperty({
    description: 'List of amenities found in the room',
    example: ['wifi', 'bed', 'air_conditioning', 'balcony'],
  })
  amenities: string[];

  @ApiProperty({
    description: 'Overall sentiment of the description',
    example: 'positive',
    enum: ['positive', 'neutral', 'negative'],
  })
  sentiment: string;

  @ApiProperty({
    description: 'Estimated price range in VND per month',
    example: { min: 2000000, max: 4000000 },
  })
  estimated_price_range: { min: number; max: number };

  @ApiProperty({
    description: 'Type of room',
    example: 'phòng_trọ',
  })
  room_type: string;

  @ApiProperty({
    description: 'Key features of the room',
    example: ['near_university', 'modern_furniture', 'spacious'],
  })
  key_features: string[];
}

/**
 * DTO for chat endpoint
 */
export class ChatRequestDto {
  @ApiProperty({
    description: 'User message (Vietnamese or English)',
    example: 'Tôi cần tìm phòng trọ gần trường ĐH TP.HCM, giá dưới 4 triệu',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Optional context for multi-turn conversations',
    required: false,
    example:
      'You are a helpful assistant for a room rental platform. Help users find suitable rooms.',
  })
  @IsOptional()
  @IsString()
  context?: string;
}

/**
 * Room info in chat response
 */
export class ChatRoomDto {
  @ApiProperty({
    description: 'Room ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Room number',
    example: '101',
  })
  roomNumber: string;

  @ApiProperty({
    description: 'Price per month in VND',
    example: 3500000,
  })
  price: number;

  @ApiProperty({
    description: 'Property name',
    required: false,
    example: 'Chung cư ABC',
  })
  propertyName?: string;

  @ApiProperty({
    description: 'Room area in m²',
    required: false,
    example: 25,
  })
  area?: number;

  @ApiProperty({
    description: 'Room status',
    required: false,
    example: 'AVAILABLE',
  })
  status?: string;
}

/**
 * Response DTO for chat endpoint
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'AI response to user message',
    example:
      'Dựa trên yêu cầu của bạn, tôi có thể tìm các phòng trọ gần các trường đại học TP.HCM...',
  })
  response: string;

  @ApiProperty({
    description: 'Rooms matching the search query',
    required: false,
    type: [ChatRoomDto],
  })
  rooms?: ChatRoomDto[];

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 245,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-12-06T10:30:45.123Z',
  })
  timestamp: Date;
}

/**
 * DTO for generating embeddings
 */
export class GenerateEmbeddingDto {
  @ApiProperty({
    description: 'Text to generate embedding for',
    example: 'Phòng trọ đẹp, sạch sẽ, có wifi và điều hòa',
  })
  @IsString()
  text: string;
}

/**
 * Response DTO for embedding generation
 */
export class EmbeddingResponseDto {
  @ApiProperty({
    description: 'Generated embedding vector (768 dimensions)',
    example: '[0.123, -0.456, 0.789, ...]',
  })
  embedding: number[];

  @ApiProperty({
    description: 'Dimension of the embedding vector',
    example: 768,
  })
  dimensions: number;

  @ApiProperty({
    description: 'Model used for embedding',
    example: 'text-embedding-004',
  })
  model: string;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 250,
  })
  processingTime: number;
}

/**
 * Response DTO for batch embeddings
 */
export class BatchEmbeddingsResponseDto {
  @ApiProperty({
    description: 'Number of texts successfully embedded',
    example: 10,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of texts that failed to embed',
    example: 0,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of generated embeddings with success/error per item',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        index: { type: 'number' },
        embedding: { type: 'array', items: { type: 'number' } },
        error: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  embeddings: Array<{
    index: number;
    embedding?: number[];
    error?: string;
    success: boolean;
  }>;

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 3500,
  })
  processingTime: number;
}

/**
 * DTO for batch embedding generation
 */
export class BatchEmbeddingsDto {
  @ApiProperty({
    description: 'Array of texts to embed',
    isArray: true,
    example: ['Phòng trọ đẹp', 'Căn hộ mini', 'Nhà nguyên căn'],
  })
  @IsArray()
  texts: string[];

  @ApiProperty({
    description: 'Batch size for processing (default: 10)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batchSize?: number;
}

/**
 * Response DTO for health check
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Service health status',
    enum: ['healthy', 'unhealthy'],
    example: 'healthy',
  })
  status: 'healthy' | 'unhealthy';

  @ApiProperty({
    description: 'Information about loaded models',
    example: {
      chat: 'gemini-2.5-flash',
      embedding: 'text-embedding-004',
    },
  })
  models: {
    chat: string;
    embedding: string;
  };

  @ApiProperty({
    description: 'API key configuration status',
    example: {
      configured: true,
      valid: true,
    },
  })
  apiKey: {
    configured: boolean;
    valid: boolean;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-12-06T10:30:45.123Z',
  })
  timestamp: Date;
}

/**
 * DTO for semantic search
 */
export class SemanticSearchDto {
  @ApiProperty({
    description: 'Natural language search query (Vietnamese)',
    example: 'Phòng trọ gần trường ĐH có máy lạnh',
  })
  @IsString()
  q: string;

  @ApiProperty({
    description: 'Number of results to return',
    required: false,
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * DTO for hybrid search (semantic + filters)
 */
export class HybridSearchDto {
  @ApiProperty({
    description: 'Natural language search query (Vietnamese)',
    example: 'Phòng trọ gần trường ĐH',
  })
  @IsString()
  q: string;

  @ApiProperty({
    description: 'Minimum price in VND',
    required: false,
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price in VND',
    required: false,
    example: 5000000,
  })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    description: 'Minimum area in m²',
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  minArea?: number;

  @ApiProperty({
    description: 'Maximum area in m²',
    required: false,
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @ApiProperty({
    description: 'Filter by amenities (comma-separated)',
    required: false,
    example: 'wifi,air_conditioning',
  })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiProperty({
    description: 'Number of results to return',
    required: false,
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

/**
 * Room search result DTO
 */
export class RoomSearchResultDto {
  @ApiProperty({
    description: 'Unique room identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Room number',
    example: '101',
  })
  roomNumber: string;

  @ApiProperty({
    description: 'Price per month in VND',
    example: 3500000,
  })
  pricePerMonth: number;

  @ApiProperty({
    description: 'Deposit in VND',
    example: 5000000,
  })
  deposit: number;

  @ApiProperty({
    description: 'Room area in m²',
    example: 30,
  })
  area: number;

  @ApiProperty({
    description: 'Room status',
    example: 'AVAILABLE',
  })
  status: string;

  @ApiProperty({
    description: 'Room description',
    example: 'Phòng trọ đẹp, sạch sẽ',
  })
  description?: string;

  @ApiProperty({
    description: 'Maximum occupants',
    example: 2,
  })
  maxOccupants: number;

  @ApiProperty({
    description: 'Property details',
  })
  property?: any;

  @ApiProperty({
    description: 'Room amenities',
  })
  amenities?: any[];

  @ApiProperty({
    description: 'Semantic similarity score (0-1)',
    example: 0.85,
  })
  similarity?: number;
}

/**
 * Semantic search response DTO
 */
export class SemanticSearchResponseDto {
  @ApiProperty({
    description: 'Search query',
    example: 'Phòng trọ gần trường ĐH',
  })
  query: string;

  @ApiProperty({
    description: 'Search method used',
    enum: ['SEMANTIC', 'HYBRID', 'STANDARD'],
    example: 'SEMANTIC',
  })
  method: 'SEMANTIC' | 'HYBRID' | 'STANDARD';

  @ApiProperty({
    description: 'Total number of results',
    example: 15,
  })
  count: number;

  @ApiProperty({
    description: 'Search results',
    type: [RoomSearchResultDto],
  })
  results: RoomSearchResultDto[];

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 350,
  })
  responseTime?: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-12-06T10:30:45.123Z',
  })
  timestamp?: string;
}

/**
 * DTO for popular searches
 */
export class PopularSearchesResponseDto {
  @ApiProperty({
    description: 'List of popular searches',
    example: [
      { query: 'phòng trọ gần trường', count: 245 },
      { query: 'nhà trọ có máy lạnh', count: 189 },
    ],
  })
  searches: Array<{ query: string; count: number }>;

  @ApiProperty({
    description: 'Time period for statistics',
    example: 'last_7_days',
  })
  period: string;
}
