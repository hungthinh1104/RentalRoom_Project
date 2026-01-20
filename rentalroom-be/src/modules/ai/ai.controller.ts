import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { SearchService } from './services/search.service';
import {
  AnalyzeRoomDescriptionDto,
  RoomAnalysisResponseDto,
  ChatRequestDto,
  ChatResponseDto,
  GenerateEmbeddingDto,
  EmbeddingResponseDto,
  BatchEmbeddingsDto,
  BatchEmbeddingsResponseDto,
  HealthCheckResponseDto,
  SemanticSearchResponseDto,
  PopularSearchesResponseDto,
  SubmitAiFeedbackDto,
} from './dto/ai.dto';

@ApiTags('AI Services')
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Health check endpoint
   * Verifies Gemini API connectivity and model availability
   *
   * @returns Health status with model information
   */
  @Get('health')
  @HttpCode(200)
  @ApiOperation({
    summary: 'AI Service Health Check',
    description: 'Check if Gemini API is accessible and models are loaded',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponseDto,
    schema: {
      example: {
        status: 'healthy',
        models: {
          chat: 'gemini-2.5-flash',
          embedding: 'text-embedding-004',
        },
        apiKey: {
          configured: true,
          valid: true,
        },
        metrics: {
          embeddingCalls: 127,
          analysisCalls: 45,
          chatCalls: 234,
          batchCalls: 8,
        },
        timestamp: '2026-01-20T10:30:45.123Z',
        cached: false,
      },
    },
  })
  async healthCheck(): Promise<HealthCheckResponseDto> {
    return await this.aiService.healthCheck();
  }

  /**
   * Generate embedding for a single text
   * Converts text to 768-dimensional vector for semantic search
   *
   * @param dto - Text to embed
   * @returns Embedding vector with metadata
   *
   * Use case: Get vector representation for semantic similarity
   */
  @Post('embeddings/generate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Generate Embedding',
    description:
      'Convert text to 768-dimensional embedding vector using text-embedding-004',
  })
  @ApiResponse({
    status: 200,
    description: 'Embedding generated successfully',
    type: EmbeddingResponseDto,
    schema: {
      example: {
        embedding: [0.0234, -0.156, 0.892, 0.234, -0.567, 0.123, -0.456],
        dimensions: 768,
        model: 'text-embedding-004',
        processingTime: 234,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty text)',
  })
  async generateEmbedding(
    @Body() dto: GenerateEmbeddingDto,
  ): Promise<EmbeddingResponseDto> {
    if (!dto.text || dto.text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    const startTime = Date.now();
    const embedding = await this.aiService.generateEmbedding(dto.text);
    const processingTime = Date.now() - startTime;

    return {
      embedding,
      dimensions: embedding.length,
      model: 'text-embedding-004',
      processingTime,
    };
  }

  /**
   * Batch generate embeddings for multiple texts
   * Useful for bulk operations (e.g., seeding room descriptions)
   *
   * @param dto - Array of texts to embed
   * @returns Array of embeddings with success/failure counts
   *
   * Rate limiting: 100ms between requests to respect API limits
   */
  @Post('embeddings/batch')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Batch Generate Embeddings',
    description:
      'Generate embeddings for multiple texts with rate limiting (100ms between requests)',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch embeddings generated',
    type: BatchEmbeddingsResponseDto,
    schema: {
      example: {
        embeddings: [
          { index: 0, embedding: [0.123, -0.456, 0.789], success: true },
          { index: 1, embedding: [-0.234, 0.567, -0.890], success: true },
          { index: 2, error: 'Text too long', success: false },
        ],
        successful: 2,
        failed: 1,
        total: 3,
        processingTime: 1234,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty array)',
  })
  async batchGenerateEmbeddings(
    @Body() dto: BatchEmbeddingsDto,
  ): Promise<BatchEmbeddingsResponseDto> {
    if (!dto.texts || dto.texts.length === 0) {
      throw new BadRequestException('Texts array cannot be empty');
    }

    const startTime = Date.now();
    const embeddings = await this.aiService.batchGenerateEmbeddings(
      dto.texts,
      dto.batchSize || 10,
    );
    const processingTime = Date.now() - startTime;

    const successful = embeddings.filter((r) => r.success).length;
    const failed = embeddings.filter((r) => !r.success).length;

    return {
      successful,
      failed,
      embeddings,
      processingTime,
    };
  }

  /**
   * Analyze room description and extract structured data
   * Uses gemini-2.5-flash with JSON mode for reliable output
   *
   * @param dto - Room description text
   * @returns Structured analysis with amenities, sentiment, price estimate
   *
   * Example input: "Phòng trọ 25m2, full nội thất, sạch sẽ, gần trường ĐH, có wifi"
   * Example output: {
   *   amenities: ['wifi', 'bed', 'furniture'],
   *   sentiment: 'positive',
   *   estimated_price_range: { min: 2000000, max: 4000000 },
   *   room_type: 'phòng_trọ',
   *   key_features: ['near_university', 'furnished']
   * }
   */
  @Post('analyze/room-description')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Analyze Room Description',
    description:
      'Extract structured data from raw room description (amenities, sentiment, price estimate, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Room description analyzed successfully',
    type: RoomAnalysisResponseDto,
    schema: {
      example: {
        amenities: ['wifi', 'air_conditioning', 'bed', 'furniture'],
        sentiment: 'positive',
        estimated_price_range: { min: 2500000, max: 3500000 },
        room_type: 'phòng_trọ',
        key_features: ['gần trường đại học', 'đầy đủ nội thất', 'sạch sẽ'],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty description)',
  })
  async analyzeRoomDescription(
    @Body() dto: AnalyzeRoomDescriptionDto,
  ): Promise<RoomAnalysisResponseDto> {
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException('Description cannot be empty');
    }

    return await this.aiService.analyzeRoomDescription(dto.description);
  }

  /**
   * Chat endpoint for conversational AI
   * Uses gemini-2.5-flash for fast, reliable responses
   *
   * @param dto - User message and optional context
   * @returns AI response
   *
   * Supports:
   * - Vietnamese and English
   * - Single-turn and multi-turn (with context)
   * - Questions about rooms, properties, general inquiries
   *
   * Example use cases:
   * - "Tôi cần tìm phòng trọ gần trường ĐH TP.HCM"
   * - "What is the cancellation policy?"
   * - "How do I book a room?"
   */
  @Post('chat')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Chat with AI',
    description:
      'Ask AI questions about rooms, properties, or general inquiries (Vietnamese or English)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat response generated successfully',
    type: ChatResponseDto,
    schema: {
      example: {
        response:
          'Tôi sẽ giúp bạn tìm phòng gần trường ĐH trong tầm giá 3 triệu. Hiện tại có vài phòng phù hợp như phòng tại Quận 1 có máy lạnh, wifi, và gần trường. Bạn muốn xem chi tiết không?',
        rooms: [
          {
            id: 'room_001',
            roomNumber: 'A101',
            price: 3200000,
            propertyName: 'Nhà trọ Ánh Dương',
            area: 25,
            status: 'AVAILABLE',
          },
          {
            id: 'room_002',
            roomNumber: 'B205',
            price: 2800000,
            propertyName: 'Chung cư mini Hòa Bình',
            area: 30,
            status: 'AVAILABLE',
          },
        ],
        processingTime: 1256,
        timestamp: '2026-01-20T10:30:45.123Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty message)',
  })
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    if (!dto.message || dto.message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    const startTime = Date.now();
    const result = await this.aiService.chatWithAI(dto.message, dto.context);
    const processingTime = Date.now() - startTime;

    return {
      response: result.response,
      rooms: result.rooms,
      processingTime,
      timestamp: new Date(),
    };
  }

  /**
   * Semantic search endpoint
   * Searches rooms using natural language understanding
   *
   * @param q - Natural language search query
   * @param limit - Number of results (max 50)
   * @returns List of semantically similar rooms
   *
   * Example: "phòng trọ gần trường ĐH có máy lạnh"
   * Returns rooms that match the semantic meaning of the query
   */
  @Get('search/semantic')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Semantic Search',
    description:
      'Search rooms using natural language understanding (Vietnamese). Returns results ranked by semantic similarity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned',
    type: SemanticSearchResponseDto,
    schema: {
      example: {
        query: 'phòng gần trường đại học có máy lạnh',
        method: 'SEMANTIC',
        count: 3,
        results: [
          {
            id: 'room_001',
            roomNumber: 'A101',
            pricePerMonth: 3200000,
            area: 25,
            similarity: 0.89,
            property: {
              name: 'Nhà trọ Ánh Dương',
              address: '123 Nguyễn Hữu Cảnh',
              city: 'Hồ Chí Minh',
            },
          },
          {
            id: 'room_002',
            roomNumber: 'B205',
            pricePerMonth: 2800000,
            area: 30,
            similarity: 0.76,
            property: {
              name: 'Chung cư mini Hòa Bình',
              address: '456 Trần Hưng Đạo',
              city: 'Hồ Chí Minh',
            },
          },
        ],
        responseTime: '1234ms',
        timestamp: '2026-01-20T10:30:45.123Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty query)',
  })
  async semanticSearch(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<SemanticSearchResponseDto> {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const startTime = Date.now();
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 12;

    const results = await this.searchService.semanticSearch(q, limitNum);

    return {
      query: q,
      method: 'SEMANTIC',
      count: results.length,
      results,
      responseTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Hybrid search endpoint
   * Searches rooms using semantic matching + filter constraints
   *
   * @param q - Natural language search query
   * @param minPrice - Minimum price in VND
   * @param maxPrice - Maximum price in VND
   * @param minArea - Minimum area in m²
   * @param maxArea - Maximum area in m²
   * @param amenities - Comma-separated amenity types to filter
   * @param limit - Number of results (max 50)
   * @returns Filtered and semantically ranked rooms
   *
   * Example: "phòng trọ" with minPrice=1000000&maxPrice=5000000&amenities=wifi,air_conditioning
   * Returns rooms with those amenities in the price range, ranked by relevance to "phòng trọ"
   */
  @Get('search/hybrid')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Hybrid Search',
    description:
      'Search rooms combining semantic matching with filter constraints (price, area, amenities). More precise than semantic search alone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned',
    type: SemanticSearchResponseDto,
    schema: {
      example: {
        query: 'phòng dưới 3 triệu quận 1',
        method: 'HYBRID',
        count: 2,
        results: [
          {
            id: 'room_005',
            roomNumber: 'C310',
            pricePerMonth: 2900000,
            area: 28,
            similarity: 0.85,
            property: {
              name: 'Nhà trọ Phú Quý',
              address: '789 Nguyễn Thái Bình',
              city: 'Hồ Chí Minh',
            },
          },
        ],
        responseTime: '856ms',
        timestamp: '2026-01-20T10:30:45.123Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (empty query)',
  })
  async hybridSearch(
    @Query('q') q: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minArea') minArea?: string,
    @Query('maxArea') maxArea?: string,
    @Query('amenities') amenities?: string,
    @Query('limit') limit?: string,
  ): Promise<SemanticSearchResponseDto> {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const startTime = Date.now();
    const limitNum = limit ? Math.min(parseInt(limit, 10), 50) : 12;

    const filters = {
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
      amenities: amenities
        ? amenities.split(',').map((a) => a.trim())
        : undefined,
    };

    const results = await this.searchService.hybridSearch(q, filters, limitNum);

    return {
      query: q,
      method: 'HYBRID',
      count: results.length,
      results,
      responseTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Popular searches endpoint
   * Returns trending search queries for autocomplete suggestions
   *
   * @param limit - Number of results (max 20)
   * @returns List of popular searches with counts
   *
   * Use case: Frontend autocomplete, search suggestions
   * Cached for better performance
   */
  @Get('analytics/popular-searches')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Popular Searches',
    description:
      'Get trending search queries for autocomplete suggestions. Cached for performance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular searches returned',
    type: PopularSearchesResponseDto,
    schema: {
      example: {
        searches: [
          { query: 'phòng trọ gần trường', count: 245 },
          { query: 'nhà trọ có máy lạnh', count: 189 },
          { query: 'phòng thuê giá rẻ', count: 156 },
          { query: 'căn hộ mini đầy đủ nội thất', count: 142 },
          { query: 'phòng ở gần chợ', count: 128 },
        ],
        period: 'last_7_days',
      },
    },
  })
  async getPopularSearches(
    @Query('limit') limit?: string,
  ): Promise<PopularSearchesResponseDto> {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 20) : 10;
    const searches = await this.searchService.getPopularSearches(limitNum);

    return {
      searches,
      period: 'last_7_days',
    };
  }

  /**
   * Submit feedback for AI responses
   *
   * @param dto - Feedback Data
   * @returns Success status
   */
  @Post('feedback')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Submit AI Feedback',
    description: 'Rate an AI interaction (like/dislike) and provide comments',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'Feedback recorded successfully',
      },
    },
  })
  async submitFeedback(@Body() dto: SubmitAiFeedbackDto) {
    await this.aiService.submitFeedback(dto);
    return { success: true };
  }
}
