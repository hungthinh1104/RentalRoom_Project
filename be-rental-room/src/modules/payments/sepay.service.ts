import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class SepayService {
    private readonly logger = new Logger(SepayService.name);
    private readonly baseUrl = 'https://my.sepay.vn/userapi';

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Verify payment for a specific contract
     */
    async verifyPayment(contract: any, expectedAmount: number): Promise<boolean> {
        try {
            // 1. Get Landlord Payment Config
            const landlordId = contract.landlordId;
            // @ts-ignore
            const config = await this.prisma.paymentConfig.findUnique({
                where: { landlordId: contract.landlordId },
            });

            if (!config || !config.isActive || !config.apiToken) {
                this.logger.warn(`No active payment config for landlord ${landlordId}`);
                return false;
            }

            // 2. Call SePay API
            const paymentRef = contract.paymentRef;
            if (!paymentRef) {
                this.logger.warn(`Contract ${contract.id} has no paymentRef`);
                return false;
            }

            // API: /transactions/list?limit=50
            const url = `${this.baseUrl}/transactions/list`;
            const response = await lastValueFrom(
                this.httpService.get(url, {
                    headers: {
                        Authorization: `Bearer ${config.apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        limit: 50, // Check recent 50 transactions
                    },
                }),
            );

            const transactions = response.data.transactions;
            if (!transactions || transactions.length === 0) {
                return false;
            }

            // 3. Find matching transaction
            const normalizedRef = paymentRef.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            const validTransaction = transactions.find((trans: any) => {
                const amountIn = parseFloat(trans.amount_in);
                const content = trans.transaction_content || "";

                const normalizedContent = content.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                // Check if content contains paymentRef (normalized)
                const isContentMatch = normalizedContent.includes(normalizedRef);

                // Check amount (allow small difference? No, precise match or greater)
                const isAmountMatch = amountIn >= expectedAmount;

                this.logger.debug(`Checking trans: ${content} (${amountIn}) vs Ref: ${paymentRef} (${expectedAmount}) -> Match: ${isContentMatch && isAmountMatch}`);

                return isContentMatch && isAmountMatch;
            });

            if (validTransaction) {
                this.logger.log(`Payment verify success for ${paymentRef}. TransID: ${validTransaction.id}`);
                return true;
            }

            return false;
        } catch (error) {
            this.logger.error(`SePay verify error for contract ${contract.id}`, error);
            return false;
        }
    }
}
