import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsGateway } from './gateways';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { NotificationType } from './entities';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let notificationsGateway: NotificationsGateway;

  const mockNotification = {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: 'Payment Due',
    content: 'Your rent payment is due in 3 days',
    notificationType: NotificationType.PAYMENT,
    relatedEntityId: faker.string.uuid(),
    isRead: false,
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockNotificationsGateway = {
    notifyUser: jest.fn(),
    notifyUsers: jest.fn(),
    broadcastToAll: jest.fn(),
    isUserConnected: jest.fn(),
    getUserConnectionCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'NOTIFICATIONS_GATEWAY',
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsGateway = module.get<NotificationsGateway>(
      'NOTIFICATIONS_GATEWAY',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const createDto = {
        userId: mockNotification.userId,
        title: mockNotification.title,
        content: mockNotification.content,
        notificationType: mockNotification.notificationType,
        relatedEntityId: mockNotification.relatedEntityId,
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const notifications = [
        mockNotification,
        { ...mockNotification, id: faker.string.uuid() },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(notifications);
      mockPrismaService.notification.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter notifications by notification type', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        mockNotification,
      ]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        notificationType: NotificationType.PAYMENT,
        skip: 0,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notificationType: NotificationType.PAYMENT,
          }),
        }),
      );
    });

    it('should filter notifications by read status', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        mockNotification,
      ]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        isRead: false,
        skip: 0,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        }),
      );
    });

    it('should filter notifications by userId', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        mockNotification,
      ]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        userId: mockNotification.userId,
        skip: 0,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockNotification.userId,
          }),
        }),
      );
    });

    it('should search notifications by title or content', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        mockNotification,
      ]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'payment',
        skip: 0,
      });

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'payment',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );

      const result = await service.findOne(mockNotification.id);

      expect(result).toBeDefined();
      expect(prismaService.notification.findUnique).toHaveBeenCalledWith({
        where: { id: mockNotification.id },
      });
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedNotification = {
        ...mockNotification,
        title: 'Updated Title',
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.update.mockResolvedValue(
        updatedNotification,
      );

      const result = await service.update(mockNotification.id, updateDto);

      expect(prismaService.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotification.id },
        data: updateDto,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        isRead: true,
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.update.mockResolvedValue(readNotification);

      const result = await service.markAsRead(mockNotification.id);

      expect(prismaService.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNotification.id },
          data: expect.objectContaining({
            isRead: true,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.remove(mockNotification.id);

      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: mockNotification.id },
      });
      expect(result).toEqual({
        message: 'Notification deleted successfully',
      });
    });
  });
});
