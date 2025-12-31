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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, FilterPaymentsDto } from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entities';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

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

  @Get(':id')
  @Auth(UserRole.TENANT, UserRole.LANDLORD, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Patch(':id/confirm')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  confirmPayment(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
