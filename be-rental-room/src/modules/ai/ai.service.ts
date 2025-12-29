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

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly analysisService: AnalysisService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService, // Inject PrismaService
  ) { }

  /**
   * Generate embedding for a given text
   *
   * @param text - The text to embed (Vietnamese or English)
   * @returns Promise<number[]> - 768-dimensional vector
   *
   * Throws error if text is empty or API call fails
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.embeddingService.generateEmbedding(text);
  }

  /**
   * Analyze a room description and extract structured data
   *
   * @param text - Raw room description (Vietnamese)
   * @returns Promise<Object> - Structured JSON with amenities, sentiment, price_estimate
   *
   * Example input: "Phòng trọ 25m2, full nội thất, sạch sẽ, gần trường ĐH, có wifi"
   * Example output: {
   *   amenities: ["wifi", "bed", "ac"],
   *   sentiment: "positive",
   *   estimated_price_range: { min: 2000000, max: 4000000 }
   * }
   */
  async analyzeRoomDescription(text: string): Promise<{
    amenities: string[];
    sentiment: string;
    estimated_price_range: { min: number; max: number };
    room_type: string;
    key_features: string[];
  }> {
    return this.analysisService.analyzeRoomDescription(text);
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
  async chatWithAI(message: string, context?: string): Promise<{
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
    return this.chatService.chatWithAI(message, context);
  }

  /**
   * Batch generate embeddings for multiple texts (e.g., all room descriptions)
   * Useful for initial seeding or bulk updates
   *
   * @param texts - Array of texts to embed
   * @param batchSize - Process in batches to respect rate limits
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  async batchGenerateEmbeddings(
    texts: string[],
    batchSize: number = 10,
  ): Promise<number[][]> {
    return this.embeddingService.batchGenerateEmbeddings(texts, batchSize);
  }

  /**
   * Health check for AI service
   * Verifies that Gemini API is accessible and models are loaded
   *
   * @returns Promise<Object> - Service health status
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    models: { chat: string; embedding: string };
    apiKey: { configured: boolean; valid: boolean };
    timestamp: Date;
  }> {
    try {
      const testEmbedding =
        await this.embeddingService.generateEmbedding('test');

      return {
        status: 'healthy',
        models: {
          chat: 'gemini-2.5-flash',
          embedding: 'text-embedding-004',
        },
        apiKey: {
          configured: true,
          valid: testEmbedding.length === 768,
        },
        timestamp: new Date(),
      };
    } catch (error: unknown) {
      this.logger.error(`❌ Health check failed:`, error);
      return {
        status: 'unhealthy',
        models: {
          chat: 'gemini-2.5-flash',
          embedding: 'text-embedding-004',
        },
        apiKey: {
          configured: true,
          valid: false,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Submit feedback for an AI interaction
   *
   * @param dto - Feedback details (interactionId, rating, comment, etc.)
   * @returns Promise<void>
   */
  async submitFeedback(dto: SubmitAiFeedbackDto): Promise<void> {
    try {
      // Assuming interactionId maps to AiInteractionLog ID
      await this.prisma.aiInteractionLog.update({
        where: { id: dto.interactionId },
        data: {
          userFeedback: dto.feedback,
          feedbackReason: dto.comment,
        },
      });
      this.logger.log(`Feedback received for interaction ${dto.interactionId}`);
    } catch (error) {
      this.logger.error(`Error saving AI feedback:`, error);
      // Fail silently or throw depending on requirement. Silent is usually better for analytics.
    }
  }
}
