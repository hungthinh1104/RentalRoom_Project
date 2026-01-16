import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AiModelFactory } from './services/ai-model.factory';
import { EmbeddingService } from './services/embedding.service';
import { AnalysisService } from './services/analysis.service';
import { ChatService } from './services/chat.service';
import { SearchService } from './services/search.service';
import { CacheService } from 'src/common/services/cache.service';

/**
 * AI Module - Gemini API Integration via LangChain
 *
 * Provides:
 * - Embedding generation (semantic vectors using text-embedding-004)
 * - Room description analysis (structured extraction via gemini-2.5-flash)
 * - Chat/QA interface (conversational AI)
 * - Semantic & hybrid search
 * - Health checks
 *
 * Models (Dec 2025):
 * - Chat: gemini-2.5-flash (stable, recommended)
 * - Embeddings: text-embedding-004 (768 dims, supported until Jan 2026)
 *
 * Configuration:
 * - Requires GEMINI_API_KEY environment variable
 * - Optional: EMBEDDING_DIMENSIONS (default: 768)
 * - Temperature: 0.7 (balanced creativity/consistency)
 * - Max output tokens: 2048
 */
@Module({
  imports: [ConfigModule],
  providers: [
    AIService,
    PrismaService,
    AiModelFactory,
    EmbeddingService,
    AnalysisService,
    ChatService,
    SearchService,
    CacheService,
  ],
  controllers: [AIController],
  exports: [AIService, SearchService],
})
export class AIModule {}
