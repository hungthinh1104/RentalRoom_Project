import {
  Module,
  Global,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ContractHashService } from './contract-hash.service';
import { PaymentIdempotencyMiddleware } from './middleware/payment-idempotency.middleware';

@Global()
@Module({
  providers: [ContractHashService, PaymentIdempotencyMiddleware],
  exports: [ContractHashService],
})
export class UtilitiesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PaymentIdempotencyMiddleware)
      .forRoutes({ path: 'payments/*', method: RequestMethod.POST });
  }
}
