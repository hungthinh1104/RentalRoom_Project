import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

import { HttpModule } from '@nestjs/axios';
import { SepayService } from './sepay.service';
import { PaymentCronService } from './payment-cron.service';

@Module({
  imports: [HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, SepayService, PaymentCronService],
  exports: [PaymentsService, SepayService],
})
export class PaymentsModule { }
