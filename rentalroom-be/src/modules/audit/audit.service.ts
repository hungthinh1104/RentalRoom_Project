import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { FilterChangeLogDto } from './dto/filter-change-log.dto';
import { PaginatedResponse } from 'src/shared/dtos';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findChangeLogs(filter: FilterChangeLogDto) {
    const {
      page = 1,
      limit = 10,
      userId,
      changeType,
      entityType,
      entityId,
    } = filter;

    const where: any = {};
    if (userId) where.userId = userId;
    if (changeType) where.changeType = changeType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [logs, total] = await Promise.all([
      (this.prisma as any).changeLog.findMany({
        where,
        skip: filter.skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      (this.prisma as any).changeLog.count({ where }),
    ]);

    return new PaginatedResponse(logs, total, page, limit);
  }
}
