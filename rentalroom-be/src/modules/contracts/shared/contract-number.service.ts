import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

/**
 * Service for generating unique contract numbers
 * Format: HD-{landlordPrefix}-{YYYYMM}-{XXXX}
 */
@Injectable()
export class ContractNumberService {
  private readonly logger = new Logger(ContractNumberService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-generate unique contract number with transaction safety
   * @param landlordId Landlord ID
   * @returns Unique contract number
   * @example "HD-ABC1-202601-0001"
   */
  async generateContractNumber(landlordId: string): Promise<string> {
    const landlordPrefix = landlordId.slice(0, 4).toUpperCase();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Use transaction to ensure atomicity and prevent race conditions
    return await this.prisma.$transaction(
      async (tx) => {
        const count = await tx.contract.count({
          where: {
            landlordId,
            contractNumber: { startsWith: `HD-${landlordPrefix}-${yearMonth}` },
          },
        });

        const sequence = String(count + 1).padStart(4, '0');
        const contractNumber = `HD-${landlordPrefix}-${yearMonth}-${sequence}`;

        this.logger.log(
          `Generated contract number: ${contractNumber} for landlord ${landlordId}`,
        );

        return contractNumber;
      },
      {
        maxWait: 5000, // Wait up to 5s for transaction lock
        timeout: 10000, // Transaction timeout 10s
      },
    );
  }
}
