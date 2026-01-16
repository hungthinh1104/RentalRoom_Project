import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateSystemFeedbackDto,
  UpdateFeedbackStatusDto,
} from './dto/system-feedback.dto';
import { Prisma, FeedbackStatus, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SystemFeedbackService {
  private readonly logger = new Logger(SystemFeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateSystemFeedbackDto) {
    const feedback = await this.prisma.systemFeedback.create({
      data: {
        userId,
        ...dto,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to user
    try {
      await this.notificationsService.create({
        userId,
        title: 'Khiếu nại đã được gửi',
        content: `Khiếu nại "${dto.title}" của bạn đã được ghi nhận. Chúng tôi sẽ xem xét trong thời gian sớm nhất.`,
        notificationType: 'COMPLAINT_CREATED',
        relatedEntityId: feedback.id,
      });
      this.logger.debug(`📬 Complaint notification sent to user ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send complaint notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return feedback;
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
      data: {
        status: dto.status,
        resolvedAt: dto.status === FeedbackStatus.RESOLVED ? new Date() : null,
      },
    });
  }

  async addResponse(id: string, response: string, responderId: string) {
    const feedback = await this.prisma.systemFeedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new Error('Complaint not found');
    }

    const updated = await this.prisma.systemFeedback.update({
      where: { id },
      data: {
        response,
        status: FeedbackStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to tenant
    try {
      await this.notificationsService.create({
        userId: feedback.user.id,
        title: 'Khiếu nại của bạn đã được phản hồi',
        content: `Khiếu nại "${feedback.title}" của bạn đã nhận được phản hồi từ chủ nhà/quản lý.`,
        notificationType: 'COMPLAINT_RESPONDED',
        relatedEntityId: id,
      });
      this.logger.debug(
        `📬 Response notification sent to tenant ${feedback.user.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send response notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return updated;
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
