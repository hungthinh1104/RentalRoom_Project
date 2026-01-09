import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          fullName: 'User One',
          role: 'tenant',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          fullName: 'User Two',
          role: 'landlord',
        },
      ];

      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledWith({
        search: undefined,
        role: undefined,
        emailVerified: false,
      });
    });

    it('should call service.findAll without parameters', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        search: undefined,
        role: undefined,
        emailVerified: false,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'tenant',
        phoneNumber: '0901234567',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('user-123');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should call service.findOne with correct id', async () => {
      const userId = 'test-user-id';
      mockUsersService.findOne.mockResolvedValue(null);

      await controller.findOne(userId);

      expect(service.findOne).toHaveBeenCalledWith(userId);
    });

    it('should handle different user roles', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
      };

      mockUsersService.findOne.mockResolvedValue(adminUser);

      const result = await controller.findOne('admin-1');

      expect(result.role).toBe('admin');
    });

    it('should return null when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
