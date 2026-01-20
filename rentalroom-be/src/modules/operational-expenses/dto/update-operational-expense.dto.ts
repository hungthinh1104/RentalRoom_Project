import { PartialType } from '@nestjs/swagger';
import { CreateOperationalExpenseDto } from './create-operational-expense.dto';

export class UpdateOperationalExpenseDto extends PartialType(CreateOperationalExpenseDto) { }
