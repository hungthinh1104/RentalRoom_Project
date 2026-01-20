import { Module } from '@nestjs/common';
import { OperationalExpensesService } from './operational-expenses.service';
import { OperationalExpensesController } from './operational-expenses.controller';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OperationalExpensesController],
    providers: [OperationalExpensesService],
    exports: [OperationalExpensesService],
})
export class OperationalExpensesModule { }
