import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  FilterPaymentsDto,
  GenerateQrDto,
} from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entities';
import { SepayService } from './sepay.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly sepayService: SepayService,
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
  findAll(@Query() filterDto: FilterPaymentsDto, @CurrentUser() user: User) {
    return this.paymentsService.findAll(filterDto, user);
  }

  /**
   * Setup or update payment configuration for landlord
   */
  @Post('config')
  @Auth(UserRole.LANDLORD)
  async setupPaymentConfig(
    @Body() configDto: { bankName: string; accountNumber: string },
    @CurrentUser() user: User,
  ) {
    const { bankName, accountNumber } = configDto;

    if (!bankName || !accountNumber) {
      throw new BadRequestException('bankName and accountNumber are required');
    }

    // Upsert payment config
    const config = await this.prisma.paymentConfig.upsert({
      where: { landlordId: user.id },
      update: {
        bankName,
        accountNumber,
        isActive: true,
      },
      create: {
        landlordId: user.id,
        provider: 'SEPAY',
        bankName,
        accountNumber,
        isActive: true,
      },
    });

    this.logger.log(`Payment config updated for landlord ${user.id}`);

    return {
      success: true,
      message: 'Payment config saved successfully',
      config: {
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        isActive: config.isActive,
      },
    };
  }

  /**
   * Get payment configuration for landlord
   */
  @Get('config')
  @Auth(UserRole.LANDLORD)
  async getPaymentConfig(@CurrentUser() user: User) {
    const config = await this.prisma.paymentConfig.findUnique({
      where: { landlordId: user.id },
    });

    if (!config) {
      return {
        success: false,
        message: 'Payment config not found',
        config: null,
      };
    }

    return {
      success: true,
      config: {
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        isActive: config.isActive,
      },
    };
  }

  @Get(':id')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, user);
  }

  @Post(':id/check')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  checkStatus(@Param('id') id: string) {
    return this.paymentsService.checkPaymentStatus(id);
  }

  @Patch(':id/confirm')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentsService.remove(id, user);
  }

  /**
   * Setup or update payment configuration for landlord
   */
  @Post('invoices/:invoiceId/qr/generate')
  @Auth(UserRole.LANDLORD)
  async generateInvoiceQr(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: User,
  ) {
    // Get invoice to verify ownership and get payment details
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // Verify landlord owns this invoice
    if (invoice.contract.landlordId !== user.id) {
      throw new BadRequestException('You do not own this invoice');
    }

    const result = await this.sepayService.generateQR(
      user.id,
      Number(invoice.totalAmount),
      invoice.invoiceNumber,
      `Thanh toan hoa don ${invoice.invoiceNumber}`,
    );

    // If generation failed, throw error so frontend gets proper error response
    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Failed to generate QR code',
      );
    }

    return result;
  }

  @Post('qr/generate')
  @Auth(UserRole.LANDLORD)
  async generateQr(
    @Body() generateQrDto: GenerateQrDto,
    @CurrentUser() user: User,
  ) {
    // Validate that landlordId in DTO matches authenticated user
    if (generateQrDto.landlordId !== user.id) {
      throw new BadRequestException('Landlord ID mismatch');
    }

    return this.sepayService.generateQR(
      user.id,
      generateQrDto.amount,
      generateQrDto.paymentRef,
      generateQrDto.description,
    );
  }

  @Post('invoices/:invoiceId/verify')
  @Auth(UserRole.LANDLORD)
  async verifyInvoicePayment(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: User,
  ) {
    this.logger.log(`Verifying payment for invoice ${invoiceId}`);

    // Get invoice with contract details
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // Check if contract exists
    if (!invoice.contract) {
      throw new BadRequestException('Invoice has no associated contract');
    }

    // Verify landlord owns this invoice's contract
    if (invoice.contract.landlordId !== user.id) {
      throw new BadRequestException('You do not own this invoice');
    }

    // Verify payment using payment service
    const expectedAmount = Number(invoice.totalAmount);
    const verificationResult = await this.paymentService.verifyPayment(
      invoice.contract,
      expectedAmount,
    );

    if (!verificationResult.success) {
      return {
        success: false,
        message:
          verificationResult.error ||
          'Payment not found in recent transactions',
      };
    }

    // Payment found! Update invoice status to PAID
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    this.logger.log(
      `✓ Invoice ${invoiceId} marked as PAID (transaction: ${verificationResult.transactionId})`,
    );

    return {
      success: true,
      message: 'Payment verified and invoice marked as paid',
      transactionId: verificationResult.transactionId,
      amount: verificationResult.amount,
      transactionDate: verificationResult.transactionDate,
    };
  }
}
