import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateOperationalExpenseDto, UpdateOperationalExpenseDto, FilterOperationalExpenseDto } from './dto';

@Injectable()
export class OperationalExpensesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateOperationalExpenseDto) {
        // Verify property ownership if propertyId is provided
        if (dto.propertyId) {
            const property = await this.prisma.property.findUnique({
                where: { id: dto.propertyId },
            });
            if (!property) throw new NotFoundException('Property not found');
            if (property.landlordId !== userId) throw new ForbiddenException('Not authorized for this property');
        }

        return this.prisma.operationalExpense.create({
            data: {
                landlordId: userId,
                ...dto,
            },
        });
    }

    async findAll(userId: string, filter: FilterOperationalExpenseDto) {
        return this.prisma.operationalExpense.findMany({
            where: {
                landlordId: userId,
                ...(filter.startDate && { date: { gte: new Date(filter.startDate) } }),
                ...(filter.endDate && { date: { lte: new Date(filter.endDate) } }),
                ...(filter.category && { category: filter.category }),
                ...(filter.propertyId && { propertyId: filter.propertyId }),
            },
            include: {
                property: {
                    select: { name: true },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        const expense = await this.prisma.operationalExpense.findUnique({
            where: { id },
            include: { property: true },
        });

        if (!expense) throw new NotFoundException('Expense not found');
        if (expense.landlordId !== userId) throw new ForbiddenException('Not authorized');

        return expense;
    }

    async update(id: string, userId: string, dto: UpdateOperationalExpenseDto) {
        await this.findOne(id, userId); // Check existence and auth

        return this.prisma.operationalExpense.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId); // Check existence and auth

        return this.prisma.operationalExpense.delete({
            where: { id },
        });
    }
}
