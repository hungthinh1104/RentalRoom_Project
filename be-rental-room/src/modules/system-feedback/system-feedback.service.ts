import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateSystemFeedbackDto,
  UpdateFeedbackStatusDto,
} from './dto/system-feedback.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SystemFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSystemFeedbackDto) {
    return this.prisma.systemFeedback.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SystemFeedbackWhereUniqueInput;
    where?: Prisma.SystemFeedbackWhereInput;
    orderBy?: Prisma.SystemFeedbackOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.systemFeedback.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateFeedbackStatusDto) {
    return this.prisma.systemFeedback.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async findOne(id: string) {
    return this.prisma.systemFeedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
