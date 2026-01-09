import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { TaxYearSummaryService } from './tax-year-summary.service';
import { CreateIncomeDto } from './dto/income.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '../users/entities';

@ApiTags('Income & Tax Tracking')
@Controller('income')
export class IncomeController {
    constructor(
        private incomeService: IncomeService,
        private expenseService: ExpenseService,
        private taxYearSummaryService: TaxYearSummaryService,
    ) { }

    @Post()
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Record income',
        description: `⚠️ DISCLAIMER: Hệ thống chỉ tracking thu nhập, không tư vấn thuế.
    
Tax category được xác định tự động dựa trên income type.
Landlord tự chịu trách nhiệm xác nhận tính chính xác.`,
    })
    async create(@Body() dto: CreateIncomeDto, @CurrentUser() user: any) {
        return this.incomeService.create(dto, user.id);
    }

    @Get('projection/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get year projection with threshold warning',
        description: 'Real-time projection - not final tax calculation. For reference only.',
    })
    async getProjection(@Param('year') year: string, @CurrentUser() user: any) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.incomeService.getYearProjection(user.id, parseInt(year));
    }

    @Get('summary/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get year income summary',
        description: '⚠️ For reference - please verify with tax professional',
    })
    @ApiQuery({ name: 'month', required: false, type: Number })
    @ApiQuery({ name: 'mode', required: false, type: String, description: 'list | summary' })
    async getYearSummary(
        @Param('year') year: string,
        @Query('month') month: string,
        @Query('mode') mode: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        if (month || mode === 'list') {
            const m = month ? parseInt(month) : undefined;
            return this.incomeService.findAll(user.id, parseInt(year), m);
        }
        return this.incomeService.getYearSummary(user.id, parseInt(year));
    }

    @Delete(':id')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Soft delete income (creates void snapshot)' })
    async delete(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.incomeService.delete(id, user.id, reason);
    }

    // --- EXPENSE ENDPOINTS ---

    @Post('expense')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Record expense',
        description: '⚠️ Chi phí KHÔNG được trừ khi tính thuế (Luật VN)',
    })
    async createExpense(@Body() dto: any, @CurrentUser() user: any) {
        return this.expenseService.create(dto, user.id);
    }

    @Get('expense/list/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get expense list' })
    async getExpenses(
        @Param('year') year: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.expenseService.findAll(user.id, parseInt(year));
    }

    @Get('expense/summary/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get expense summary by type/month' })
    async getExpenseSummary(
        @Param('year') year: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.expenseService.getYearSummary(user.id, parseInt(year));
    }

    @Delete('expense/:id')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete expense' })
    async deleteExpense(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.expenseService.delete(id, user.id, reason || 'No reason provided');
    }

    // --- TAX YEAR SUMMARY ENDPOINTS ---

    @Post('tax-year/close/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Close and freeze tax year calculations',
        description: '⚠️ PERMANENT ACTION: Creates immutable snapshot. Cannot be undone.',
    })
    async closeTaxYear(
        @Param('year') year: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.taxYearSummaryService.closeYear(user.id, parseInt(year), user.id);
    }

    @Get('tax-year/:year')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get tax year summary (Frozen if closed)' })
    async getTaxYearStatus(
        @Param('year') year: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.taxYearSummaryService.getSummary(user.id, parseInt(year));
    }

    @Get('tax-year/:year/export')
    @Auth(UserRole.LANDLORD, UserRole.ADMIN)
    @ApiOperation({ summary: 'Export tax data to CSV' })
    async exportTaxData(
        @Param('year') year: string,
        @CurrentUser() user: any,
    ) {
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }
        return this.taxYearSummaryService.exportData(user.id, parseInt(year));
    }
}
