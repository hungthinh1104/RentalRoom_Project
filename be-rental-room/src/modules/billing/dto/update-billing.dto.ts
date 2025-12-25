import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { CreateInvoiceLineItemDto } from './create-invoice-line-item.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
export class UpdateInvoiceLineItemDto extends PartialType(
  CreateInvoiceLineItemDto,
) {}
