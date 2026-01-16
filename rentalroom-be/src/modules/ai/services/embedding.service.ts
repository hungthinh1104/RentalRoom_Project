import { Injectable, Logger } from '@nestjs/common';
import { AiModelFactory } from './ai-model.factory';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly modelFactory: AiModelFactory) {}

  /**
   * Generate a 768-dimension embedding using text-embedding-004.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    const embeddingModel = this.modelFactory.getEmbeddingModel();
    const embedding = await embeddingModel.embedQuery(text);

    if (!embedding || embedding.length !== 768) {
      this.logger.error(
        `Embedding dimension mismatch: expected 768, got ${embedding?.length || 0}`,
      );
      throw new Error('Invalid embedding dimension');
    }

    return embedding;
  }

  /**
   * Batch embed with light rate limiting (100ms/item, 1s/batch gap).
   */
  async batchGenerateEmbeddings(
    texts: string[],
    batchSize = 10,
  ): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      for (const text of batch) {
        try {
          const vector = await this.generateEmbedding(text);
          results.push(vector);
          await new Promise((r) => setTimeout(r, 100));
        } catch (err) {
          this.logger.warn(
            `Failed to embed text: "${text.substring(0, 30)}..."`,
            err as Error,
          );
        }
      }
      if (i + batchSize < texts.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return results;
  }
}
