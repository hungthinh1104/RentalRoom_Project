import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CacheService } from 'src/common/services/cache.service';
import { v4 as uuid } from 'uuid';

export interface PdfJobResult {
  pdfUrl?: string;
  signedUrl?: string;
  fileName?: string;
  message?: string;
}

export interface PdfJob {
  jobId: string;
  contractId: string;
  templateName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: PdfJobResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
}

/**
 * PdfQueueService - Level 1 (Redis-based Job Tracker)
 *
 * Manages async PDF generation job tracking using Redis cache.
 *
 * IMPORTANT:
 * - This is a job STATUS STORE, not a task QUEUE
 * - For true queue semantics, upgrade to BullMQ/Cloud Tasks (Level 2)
 * - Current design is safe for MVP/low-concurrency scenarios
 *
 * Features:
 * - UUID-based job IDs (no collision)
 * - Idempotent per contract (1 pending job max)
 * - Atomic state transitions
 * - Processing timeout detection
 * - Progress tracking (0-100%)
 * - Auto-expiry after TTL
 */
@Injectable()
export class PdfQueueService {
  private readonly logger = new Logger(PdfQueueService.name);
  private readonly JOB_TTL = 3600; // 1 hour
  private readonly PROCESSING_TIMEOUT = 300; // 5 minutes - consider job hung if processing > this

  constructor(private readonly cache: CacheService) {}

  /**
   * Create PDF generation job (idempotent per contract)
   *
   * BEHAVIOR:
   * - If pending/processing job exists for contract → return existing jobId
   * - If completed/failed job exists → create new job
   * - Prevents duplicate PDF generation for same contract
   */
  async createJob(
    contractId: string,
    templateName?: string,
  ): Promise<{ jobId: string; isNew: boolean }> {
    // Check for existing pending/processing job
    const existingJobId = await this.findActiveJobByContract(contractId);
    if (existingJobId) {
      this.logger.log(
        `Reusing active PDF job for contract ${contractId}: ${existingJobId}`,
      );
      return { jobId: existingJobId, isNew: false };
    }

    // Create new job with UUID
    const jobId = `pdf-job:${uuid()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.JOB_TTL * 1000);

    const job: PdfJob = {
      jobId,
      contractId,
      templateName,
      status: 'pending',
      progress: 0,
      createdAt: now,
      expiresAt,
    };

    // Store job with expiry
    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);

    // IMPORTANT: Also store contract → job mapping for idempotency
    const contractKey = `pdf-job-contract:${contractId}`;
    await this.cache.set(contractKey, jobId, this.JOB_TTL);

    this.logger.log(
      `PDF job created: ${jobId} (contract: ${contractId}, new: true)`,
    );
    return { jobId, isNew: true };
  }

  /**
   * Find active (pending/processing) job for contract
   * Returns jobId if exists, null otherwise
   */
  private async findActiveJobByContract(
    contractId: string,
  ): Promise<string | null> {
    const contractKey = `pdf-job-contract:${contractId}`;
    const jobId = await this.cache.get(contractKey);

    if (!jobId || typeof jobId !== 'string') {
      return null;
    }

    const job = await this.getJob(jobId);
    if (!job) {
      // Cached mapping stale, clean it
      await this.cache.del(contractKey);
      return null;
    }

    // Only return if still pending or processing
    if (job.status === 'pending' || job.status === 'processing') {
      return jobId;
    }

    // Job completed/failed, allow new job
    await this.cache.del(contractKey);
    return null;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<PdfJob | null> {
    const data = await this.cache.get(jobId);
    if (!data || typeof data !== 'string') return null;

    try {
      const parsed = JSON.parse(data) as PdfJob;

      // Restore Date objects
      if (parsed.createdAt)
        parsed.createdAt = new Date(parsed.createdAt as unknown as string);
      if (parsed.startedAt)
        parsed.startedAt = new Date(parsed.startedAt as unknown as string);
      if (parsed.completedAt)
        parsed.completedAt = new Date(parsed.completedAt as unknown as string);
      if (parsed.expiresAt)
        parsed.expiresAt = new Date(parsed.expiresAt as unknown as string);

      // CRITICAL: Detect hung jobs (processing > PROCESSING_TIMEOUT)
      if (
        parsed.status === 'processing' &&
        parsed.startedAt &&
        Date.now() - parsed.startedAt.getTime() > this.PROCESSING_TIMEOUT * 1000
      ) {
        this.logger.warn(
          `Hung job detected: ${jobId} (processing for ${Math.round((Date.now() - parsed.startedAt.getTime()) / 1000)}s)`,
        );
        // Mark as failed to unblock client
        parsed.status = 'failed';
        parsed.error = 'Processing timeout - job appears hung';
        parsed.completedAt = new Date();
      }

      return parsed;
    } catch (error) {
      this.logger.error(
        `Failed to parse job ${jobId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Mark job as processing (with startedAt timestamp)
   * ATOMIC: Uses WATCH/MULTI pattern equivalent via atomic set
   */
  async markProcessing(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new BadRequestException(
        `Cannot mark ${job.status} job as processing`,
      );
    }

    job.status = 'processing';
    job.progress = 10; // Start at 10%
    job.startedAt = new Date();

    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
    this.logger.log(
      `PDF job processing: ${jobId} (contract: ${job.contractId})`,
    );
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, progress: number): Promise<void> {
    if (progress < 0 || progress > 100) {
      throw new BadRequestException('Progress must be 0-100');
    }

    const job = await this.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    job.progress = progress;
    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);
  }

  /**
   * Mark job as completed
   * ATOMIC: Ensures transition from processing → completed
   */
  async markCompleted(jobId: string, result: PdfJobResult): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    if (job.status !== 'processing') {
      throw new BadRequestException(
        `Cannot complete ${job.status} job (expected: processing)`,
      );
    }

    job.status = 'completed';
    job.progress = 100;
    job.result = result;
    job.completedAt = new Date();

    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);

    // Clean contract mapping to allow new jobs
    await this.cache.del(`pdf-job-contract:${job.contractId}`);

    this.logger.log(
      `PDF job completed: ${jobId} (contract: ${job.contractId}, result: ${result.fileName || 'no-file'})`,
    );
  }

  /**
   * Mark job as failed
   * ATOMIC: Ensures transition to failed state
   */
  async markFailed(jobId: string, error: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    if (job.status === 'completed') {
      throw new BadRequestException('Cannot fail already completed job');
    }

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();

    await this.cache.set(jobId, JSON.stringify(job), this.JOB_TTL);

    // Clean contract mapping to allow retry
    await this.cache.del(`pdf-job-contract:${job.contractId}`);

    this.logger.error(
      `PDF job failed: ${jobId} (contract: ${job.contractId}) - ${error}`,
    );
  }
}
