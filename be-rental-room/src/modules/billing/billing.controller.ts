import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
  UpdateInvoiceDto,
  FilterInvoicesDto,
} from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
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
  findAllInvoices(@Query() filterDto: FilterInvoicesDto) {
    return this.billingService.findAllInvoices(filterDto);
  }

  @Get('invoices/:id')
  @Auth()
  findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOneInvoice(id);
  }

  @Patch('invoices/:id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  updateInvoice(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.billingService.updateInvoice(id, updateDto);
  }

  @Patch('invoices/:id/mark-paid')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  markAsPaid(@Param('id') id: string) {
    return this.billingService.markAsPaid(id);
  }

  @Delete('invoices/:id')
  @Auth(UserRole.ADMIN)
  removeInvoice(@Param('id') id: string) {
    return this.billingService.removeInvoice(id);
  }
}
