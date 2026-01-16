import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { PdfService } from './services';
import type { Response } from 'express';
import { Header } from '@nestjs/common';
import {
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
  UpdateInvoiceDto,
  FilterInvoicesDto,
} from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('invoices')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.createInvoice(createInvoiceDto, {
      id: user.id,
      role: user.role,
    });
  }

  @Post('invoices/:invoiceId/items')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  addLineItem(
    @Param('invoiceId') invoiceId: string,
    @Body() createLineItemDto: CreateInvoiceLineItemDto,
  ) {
    return this.billingService.addLineItem(invoiceId, createLineItemDto);
  }

  @Get('invoices')
  @Auth()
  findAllInvoices(
    @Query() filterDto: FilterInvoicesDto,
    @CurrentUser() user: any,
  ) {
    // 🔒 SECURITY: Filter invoices by user role
    if (user.role === UserRole.LANDLORD) {
      filterDto.landlordId = user.id;
    } else if (user.role === UserRole.TENANT) {
      filterDto.tenantId = user.id;
    }
    return this.billingService.findAllInvoices(filterDto);
  }

  @Get('invoices/:id')
  @Auth()
  findOneInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billingService.findOneInvoice(id, user);
  }

  @Patch('invoices/:id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  updateInvoice(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.billingService.updateInvoice(id, updateDto);
  }

  @Patch('invoices/:id/mark-paid')
  @Auth(UserRole.LANDLORD) // Only landlord owns invoices
  markAsPaid(@Param('id') id: string) {
    return this.billingService.markAsPaid(id);
  }

  @Delete('invoices/:id')
  @Auth(UserRole.ADMIN)
  removeInvoice(@Param('id') id: string) {
    return this.billingService.removeInvoice(id);
  }

  /**
   * Get utility billing details for tenant
   * Returns: services, latest meter readings, and total for a month
   */
  @Get('utilities')
  @Auth(UserRole.TENANT)
  async getUtilityBilling(
    @CurrentUser() user: any,
    @Query('month') month: string,
  ) {
    return this.billingService.getUtilityBilling(user.id, month);
  }

  /**
   * Get last meter readings for tenant's services
   */
  @Get('last-readings')
  @Auth(UserRole.TENANT)
  async getLastReadings(@CurrentUser() user: any) {
    return this.billingService.getLastReadings(user.id);
  }

  /**
   * Submit meter readings for utilities (for Landlord)
   */
  @Post('meter-readings')
  @Auth(UserRole.LANDLORD)
  async submitMeterReadings(
    @Body()
    dto: {
      contractId: string;
      month: string;
      readings: Array<{ serviceId: string; currentReading: number }>;
    },
  ) {
    return this.billingService.submitMeterReadingsForLandlord(dto);
  }

  /**
   * Get meter readings for a contract (for Landlord)
   */
  @Get('meter-readings/:contractId')
  @Auth(UserRole.LANDLORD)
  async getMeterReadings(
    @Param('contractId') contractId: string,
    @Query('month') month?: string,
  ) {
    return this.billingService.getMeterReadings(contractId, month);
  }

  /**
   * Generate utility invoice from meter readings
   * Creates invoice with line items for each service
   */

  @Get('utilities/invoices')
  @Auth(UserRole.TENANT, UserRole.LANDLORD)
  @Header('Cache-Control', 'private, max-age=300')
  async getUtilityInvoices(
    @CurrentUser() user: any,
    @Query('month') month?: string,
  ) {
    // Route to appropriate service method based on role
    if (user.role === UserRole.LANDLORD) {
      return this.billingService.getUtilityInvoicesForLandlord(user.id, month);
    }
    return this.billingService.getUtilityInvoicesForTenant(user.id, month);
  }

  /**
   * Record a payment for utility invoice
   * Marks invoice as PAID or OVERDUE (if partial)
   * LANDLORD can pay on behalf of tenant
   */
  @Post('utilities/invoices/:invoiceId/pay')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  async recordUtilityPayment(
    @Param('invoiceId') invoiceId: string,
    @Body() body: { amount: number; paymentMethod: string },
    @CurrentUser() user: any,
  ) {
    return this.billingService.recordUtilityPayment(
      invoiceId,
      body.amount,
      body.paymentMethod as any,
      user,
    );
  }

  @Get('invoices/:id/download')
  @Auth()
  async downloadInvoice(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    // Verify user has access to this invoice
    const invoice = await this.billingService.findOneInvoice(id, user);
    if (!invoice) {
      res.status(404).send('Invoice not found');
      return;
    }

    return this.pdfService.generateInvoicePDF(id, res);
  }
}
