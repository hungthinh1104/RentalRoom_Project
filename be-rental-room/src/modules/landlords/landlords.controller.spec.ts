import { Test, TestingModule } from '@nestjs/testing';
import { LandlordsController } from './landlords.controller';
import { LandlordsService } from './landlords.service';
import {
  CreateLandlordDto,
  UpdateLandlordDto,
  FilterLandlordsDto,
} from './dto';
import { UserRole } from '@prisma/client';
import { UserRole } from '@prisma/client';

describe('LandlordsController', () => {
  let controller: LandlordsController;
  let service: LandlordsService;

  const mockLandlordsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  const mockUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandlordsController],
      providers: [
        {
          provide: LandlordsService,
          useValue: mockLandlordsService,
        },
      ],
    }).compile();

    controller = module.get<LandlordsController>(LandlordsController);
    service = module.get<LandlordsService>(LandlordsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new landlord', async () => {
      const createDto: CreateLandlordDto = {
        userId: 'user-123',
        fullName: 'Nguyen Van A',
        phoneNumber: '+84987654321',
        email: 'landlord@example.com',
        bankName: 'Vietcombank',
        bankAccount: '1234567890',
      };

      const mockCreatedLandlord = {
        id: 'landlord-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLandlordsService.create.mockResolvedValue(mockCreatedLandlord);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedLandlord);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all landlords with filter', async () => {
      const filterDto: FilterLandlordsDto = { skip: 0 };

      const mockLandlords = [
        { id: 'landlord-1', userId: 'user-1', bankName: 'Vietcombank' },
        { id: 'landlord-2', userId: 'user-2', bankName: 'BIDV' },
      ];

      mockLandlordsService.findAll.mockResolvedValue(mockLandlords);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockLandlords);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should return empty array when no landlords match', async () => {
      const filterDto: FilterLandlordsDto = { skip: 0 };

      mockLandlordsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('should return a single landlord by id', async () => {
      const landlordId = 'landlord-123';
      const mockLandlord = {
        id: landlordId,
        userId: 'user-123',
        bankName: 'Vietcombank',
      };

      mockLandlordsService.findOne.mockResolvedValue(mockLandlord);

      const result = await controller.findOne(landlordId);

      expect(result).toEqual(mockLandlord);
      expect(service.findOne).toHaveBeenCalledWith(landlordId);
    });
  });

  describe('update', () => {
    it('should update a landlord', async () => {
      const landlordId = 'landlord-123';
      const updateDto: UpdateLandlordDto = {
        bankName: 'BIDV',
        bankAccount: '0987654321',
      };

      const mockUpdatedLandlord = {
        id: landlordId,
        userId: 'user-123',
        fullName: 'Nguyen Van A',
        phoneNumber: '+84987654321',
        email: 'landlord@example.com',
        ...updateDto,
      };

      mockLandlordsService.update.mockResolvedValue(mockUpdatedLandlord);

      const result = await controller.update(landlordId, updateDto, mockUser);

      expect(result).toEqual(mockUpdatedLandlord);
      expect(service.update).toHaveBeenCalledWith(
        landlordId,
        updateDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a landlord', async () => {
      const landlordId = 'landlord-123';

      mockLandlordsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(landlordId, mockUser);

      expect(result).toEqual(mockDeletedResponse);
      expect(service.remove).toHaveBeenCalledWith(landlordId, mockUser);
    });
  });
});
