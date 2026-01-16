import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';

/**
 * Centralized Gemini model factory to avoid scattered instantiation and to
 * enforce the Dec 2025 model/version policy in one place.
 */
@Injectable()
export class AiModelFactory {
  private readonly logger = new Logger(AiModelFactory.name);
  private readonly apiKey: string;
  private chatModel?: ChatGoogleGenerativeAI;
  private embeddingModel?: GoogleGenerativeAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
  }

  getChatModel(): ChatGoogleGenerativeAI {
    if (!this.chatModel) {
      this.chatModel = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        apiKey: this.apiKey,
        maxOutputTokens: 2048,
        temperature: 0.7,
      });
      this.logger.log('Chat model initialized: gemini-2.5-flash');
    }
    return this.chatModel;
  }

  getEmbeddingModel(): GoogleGenerativeAIEmbeddings {
    if (!this.embeddingModel) {
      this.embeddingModel = new GoogleGenerativeAIEmbeddings({
        model: 'text-embedding-004',
        apiKey: this.apiKey,
      });
      this.logger.log(
        'Embedding model initialized: text-embedding-004 (768 dims)',
      );
    }
    return this.embeddingModel;
  }
}
