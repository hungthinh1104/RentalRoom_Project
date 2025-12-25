import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/common/services/cache.service';

export interface PdfJob {
  contractId: string;
  templateName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * PdfQueueService
 * Manages async PDF generation using Redis cache
 * Prevents blocking main thread when Puppeteer renders PDFs
 */
@Injectable()
export class PdfQueueService {
  private readonly logger = new Logger(PdfQueueService.name);
  private readonly JOB_TTL = 3600; // 1 hour

  constructor(private readonly cache: CacheService) {}

  /**
   * Create PDF generation job
   */
  async createJob(contractId: string, templateName?: string): Promise<string> {
    const jobId = `pdf-job:${contractId}:${Date.now()}`;
    const job: PdfJob = {
      contractId,
      templateName,
      status: 'pending',
      createdAt: new Date(),
    };

    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
    this.logger.log(`PDF job created: ${jobId}`);
    return jobId;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<PdfJob | null> {
    const data = await this.cache.get(jobId);
    if (!data || typeof data !== 'string') return null;
    const parsed = JSON.parse(data) as PdfJob;
    // Convert ISO string dates back to Date objects
    if (parsed.createdAt)
      parsed.createdAt = new Date(parsed.createdAt as unknown as string);
    if (parsed.completedAt)
      parsed.completedAt = new Date(parsed.completedAt as unknown as string);
    return parsed;
  }

  /**
   * Update job status to processing
   */
  async markProcessing(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      job.status = 'processing';
      await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
    }
  }

  /**
   * Mark job as completed
   */
  async markCompleted(jobId: string, result: any): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
      this.logger.log(`PDF job completed: ${jobId}`);
    }
  }

  /**
   * Mark job as failed
   */
  async markFailed(jobId: string, error: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
      await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
      this.logger.error(`PDF job failed: ${jobId} - ${error}`);
    }
  }
}
