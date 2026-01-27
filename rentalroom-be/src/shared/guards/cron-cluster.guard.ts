import { Injectable, Logger } from '@nestjs/common';

/**
 * Cluster-safe Cron Guard
 *
 * When running with PM2 in cluster mode (instances: "max"),
 * cron jobs run on ALL instances simultaneously by default.
 *
 * This utility provides a simple check to ensure cron jobs
 * only run on the primary instance (instance 0).
 *
 * USAGE:
 * ```typescript
 * @Cron('0 0 * * *')
 * async dailyCleanup() {
 *   if (!this.cronGuard.isPrimaryInstance()) return;
 *   // ... job logic
 * }
 * ```
 */
@Injectable()
export class CronClusterGuard {
    private readonly logger = new Logger(CronClusterGuard.name);
    private readonly instanceId: string;

    constructor() {
        // PM2 sets NODE_APP_INSTANCE to distinguish cluster instances
        // Falls back to '0' for non-cluster mode (single instance)
        this.instanceId = process.env.NODE_APP_INSTANCE || '0';
    }

    /**
     * Check if this is the primary instance (instance 0)
     * Use this at the start of cron jobs to prevent duplicate execution
     */
    isPrimaryInstance(): boolean {
        return this.instanceId === '0';
    }

    /**
     * Get current instance ID (for logging)
     */
    getInstanceId(): string {
        return this.instanceId;
    }

    /**
     * Log and check in one call
     * Returns true if should execute, false if should skip
     */
    shouldExecute(jobName: string): boolean {
        const isPrimary = this.isPrimaryInstance();

        if (!isPrimary) {
            this.logger.debug(
                `⏭️ Skipping cron job "${jobName}" on instance ${this.instanceId} (not primary)`,
            );
        }

        return isPrimary;
    }
}
