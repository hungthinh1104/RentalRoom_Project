import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface SepayWebhookDto {
    transactionId: string;
    amount: number;
    invoiceId: string;
    tenantId: string;
    paidAt: string;
    bankCode?: string;
    description?: string;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly paymentWebhookService: PaymentWebhookService,
    ) { }

    /**
     * SePay Webhook Handler
     * Receives payment notifications from SePay
     */
    @Post('sepay')
    @ApiOperation({
        summary: 'SePay payment webhook',
        description: 'Receives payment notifications from SePay with idempotency support',
    })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
    async handleSepayWebhook(
        @Body() payload: SepayWebhookDto,
        @Headers('x-sepay-signature') signature: string,
    ) {
        this.logger.log(`Received SePay webhook: ${payload.transactionId}`);

        try {
            const result = await this.paymentWebhookService.handleSepayWebhook(
                payload,
                signature,
            );

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            this.logger.error('Webhook processing failed:', error);
            throw error;
        }
    }
}
