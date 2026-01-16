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

    return {
      successful: embeddings.length,
      failed: dto.texts.length - embeddings.length,
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
  })
  getPopularSearches(
    @Query('limit') limit?: string,
  ): PopularSearchesResponseDto {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 20) : 10;
    const searches = this.searchService.getPopularSearches(limitNum);

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
  })
  async submitFeedback(@Body() dto: SubmitAiFeedbackDto) {
    await this.aiService.submitFeedback(dto);
    return { success: true };
  }
}
