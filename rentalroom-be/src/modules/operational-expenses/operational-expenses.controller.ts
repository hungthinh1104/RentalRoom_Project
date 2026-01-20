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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperationalExpensesService } from './operational-expenses.service';
import {
  CreateOperationalExpenseDto,
  UpdateOperationalExpenseDto,
  FilterOperationalExpenseDto,
} from './dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { User } from '../users/entities';

@ApiTags('Operational Expenses')
@ApiBearerAuth()
@Controller('operational-expenses')
@Auth(UserRole.LANDLORD)
export class OperationalExpensesController {
  constructor(private readonly service: OperationalExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new expense' })
  create(@CurrentUser() user: User, @Body() dto: CreateOperationalExpenseDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  findAll(
    @CurrentUser() user: User,
    @Query() filter: FilterOperationalExpenseDto,
  ) {
    return this.service.findAll(user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense details' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateOperationalExpenseDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }
}
