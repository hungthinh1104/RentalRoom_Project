import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './services/embedding.service';
import { AnalysisService } from './services/analysis.service';
import { ChatService } from './services/chat.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SubmitAiFeedbackDto } from './dto/ai.dto';

/**
 * AIService - Implements Google Gemini integration via LangChain
 *
 * CRITICAL API CONTEXT (Dec 2025):
 * - DEPRECATED MODELS: Do NOT use gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro
 *   These were shutdown as of Sept 2025 per Google's official changelog
 * - TARGET MODELS:
 *   * gemini-2.5-flash: Fast, cost-effective, ideal for logic/analysis/chat
 *   * gemini-embedding-001 or text-embedding-004: For embeddings (768 dims)
 *
 * Why gemini-2.5-flash?
 * - More stable and reliable than deprecated 1.5 series
 * - Better performance for structured output (JSON mode)
 * - Faster inference, lower latency for real-time applications
 * - Cost-effective compared to pro models
 *
 * LangChain Benefits:
 * - Abstracts API version changes (easier migration in future)
 * - Built-in error handling and retry logic
 * - Standardized interface across different AI providers
 * - Better integration with prompt chains and memory
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private lastHealthCheck: {
    result: any;
    timestamp: number;
  } | null = null;
  private readonly HEALTH_CACHE_TTL = 300000; // 5 minutes

  private metrics = {
    embeddingCalls: 0,
    analysisCalls: 0,
    chatCalls: 0,
    batchCalls: 0,
    lastReset: Date.now(),
  };

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly analysisService: AnalysisService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) {}

  /**
   * Generate embedding for a given text
   *
   * @param text - The text to embed (Vietnamese or English)
   * @param timeoutMs - Timeout in milliseconds (default: 10000)
   * @returns Promise<number[]> - 768-dimensional vector
   *
   * Throws error if text is empty or API call fails
   */
  async generateEmbedding(
    text: string,
    timeoutMs: number = 10000,
  ): Promise<number[]> {
    this.metrics.embeddingCalls++;
    return Promise.race([
      this.embeddingService.generateEmbedding(text),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Analyze a room description and extract structured data
   *
   * @param text - Raw room description (Vietnamese)
   * @param timeoutMs - Timeout in milliseconds (default: 15000)
   * @returns Promise<Object> - Structured JSON with amenities, sentiment, price_estimate
   *
   * Example input: "Phòng trọ 25m2, full nội thất, sạch sẽ, gần trường ĐH, có wifi"
   * Example output: {
   *   amenities: ["wifi", "bed", "ac"],
   *   sentiment: "positive",
   *   estimated_price_range: { min: 2000000, max: 4000000 }
   * }
   */
  async analyzeRoomDescription(
    text: string,
    timeoutMs: number = 15000,
  ): Promise<{
    amenities: string[];
    sentiment: string;
    estimated_price_range: { min: number; max: number };
    room_type: string;
    key_features: string[];
  }> {
    this.metrics.analysisCalls++;
    return Promise.race([
      this.analysisService.analyzeRoomDescription(text),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Simple chat interface for AI conversation
   *
   * @param message - User message (can be Vietnamese or English)
   * @param context - Optional context for multi-turn conversations
   * @returns Promise<ChatResponse> - AI response with optional rooms array
   *
   * Use case: Tenant questions about properties, general inquiries
   */
  async chatWithAI(
    message: string,
    context?: string,
  ): Promise<{
    response: string;
    rooms?: Array<{
      id: string;
      roomNumber: string;
      price: number;
      propertyName?: string;
      area?: number;
      status?: string;
    }>;
  }> {
    this.metrics.chatCalls++;
    return this.chatService.chatWithAI(message, context);
  }

  /**
   * Batch generate embeddings for multiple texts (e.g., all room descriptions)
   * Useful for initial seeding or bulk updates
   *
   * @param texts - Array of texts to embed
   * @param batchSize - Process in batches to respect rate limits
   * @returns Promise<Array> - Array of results with success/error per item
   */
  async batchGenerateEmbeddings(
    texts: string[],
    batchSize: number = 10,
  ): Promise<
    Array<{ index: number; embedding?: number[]; error?: string; success: boolean }>
  > {
    this.metrics.batchCalls++;
    const results: Array<{
      index: number;
      embedding?: number[];
      error?: string;
      success: boolean;
    }> = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (text, batchIdx) => {
          try {
            const embedding = await this.embeddingService.generateEmbedding(
              text,
            );
            return { index: i + batchIdx, embedding, success: true };
          } catch (error: unknown) {
            return {
              index: i + batchIdx,
              error: String(error),
              success: false,
            };
          }
        }),
      );

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            index: results.length,
            error: result.reason,
            success: false,
          });
        }
      });
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(
      `Batch embedding completed: ${successCount}/${texts.length} successful`,
    );

    return results;
  }

  /**
   * Health check for AI service
   * Verifies that Gemini API is accessible and models are loaded
   * Cached for 5 minutes to avoid excessive API calls
   *
   * @param forceRefresh - Force a fresh health check, bypassing cache
   * @returns Promise<Object> - Service health status
   */
  async healthCheck(forceRefresh: boolean = false): Promise<{
    status: 'healthy' | 'unhealthy';
    models: { chat: string; embedding: string };
    apiKey: { configured: boolean; valid: boolean };
    metrics: typeof this.metrics;
    timestamp: Date;
    cached: boolean;
  }> {
    const now = Date.now();

    // Return cached result if available and not expired
    if (
      !forceRefresh &&
      this.lastHealthCheck &&
      now - this.lastHealthCheck.timestamp < this.HEALTH_CACHE_TTL
    ) {
      return { ...this.lastHealthCheck.result, cached: true };
    }

    // Perform actual health check
    try {
      const testEmbedding = await Promise.race([
        this.embeddingService.generateEmbedding('health'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000),
        ),
      ]);

      const result = {
        status: 'healthy' as const,
        models: {
          chat: 'gemini-2.5-flash',
          embedding: 'text-embedding-004',
        },
        apiKey: {
          configured: !!process.env.GEMINI_API_KEY,
          valid: testEmbedding.length === 768,
        },
        metrics: { ...this.metrics },
        timestamp: new Date(),
        cached: false,
      };

      this.lastHealthCheck = { result, timestamp: now };
      return result;
    } catch (error: unknown) {
      this.logger.error(`❌ Health check failed:`, error);
      const result = {
        status: 'unhealthy' as const,
        models: {
          chat: 'gemini-2.5-flash',
          embedding: 'text-embedding-004',
        },
        apiKey: {
          configured: !!process.env.GEMINI_API_KEY,
          valid: false,
        },
        metrics: { ...this.metrics },
        timestamp: new Date(),
        cached: false,
      };

      this.lastHealthCheck = { result, timestamp: now };
      return result;
    }
  }

  /**
   * Submit feedback for an AI interaction
   *
   * @param dto - Feedback details (interactionId, rating, comment, etc.)
   * @returns Promise<{success: boolean; message?: string}>
   */
  async submitFeedback(
    dto: SubmitAiFeedbackDto,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await this.prisma.aiInteractionLog.update({
        where: { id: dto.interactionId },
        data: {
          userFeedback: dto.feedback,
          feedbackReason: dto.comment,
        },
      });
      this.logger.log(`Feedback received for interaction ${dto.interactionId}`);
      return { success: true };
    } catch (error: unknown) {
      // Prisma NotFound error (P2025)
      if ((error as any)?.code === 'P2025') {
        this.logger.warn(
          `Interaction ${dto.interactionId} not found for feedback`,
        );
        return {
          success: false,
          message: `Interaction ${dto.interactionId} not found`,
        };
      }

      // Other errors
      this.logger.error(
        `Error saving AI feedback for ${dto.interactionId}:`,
        error,
      );
      return { success: false, message: 'Failed to save feedback' };
    }
  }
}
