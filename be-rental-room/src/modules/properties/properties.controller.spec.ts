import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  FilterPropertiesDto,
} from './dto';
import { PropertyType } from './entities';
import { UserRole } from '@prisma/client';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let service: PropertiesService;

  const mockPropertiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        {
          provide: PropertiesService,
          useValue: mockPropertiesService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
    service = module.get<PropertiesService>(PropertiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const createDto: CreatePropertyDto = {
        landlordId: 'landlord-123',
        name: 'Sunrise Apartments',
        address: '123 Main Street',
        city: 'Hanoi',
        ward: 'Ba Dinh',
        propertyType: PropertyType.APARTMENT,
      };

      const mockCreatedProperty = {
        id: 'property-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPropertiesService.create.mockResolvedValue(mockCreatedProperty);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedProperty);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all properties with filter', async () => {
      const filterDto: FilterPropertiesDto = {
        skip: 0,
        city: 'Hanoi',
      };

      const mockProperties = [
        { id: 'property-1', address: '123 Main St', city: 'Hanoi' },
        { id: 'property-2', address: '456 Second St', city: 'Hanoi' },
      ];

      mockPropertiesService.findAll.mockResolvedValue(mockProperties);

      const result = await controller.findAll(filterDto, mockUser);

      expect(result).toEqual(mockProperties);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should return empty array when no properties match', async () => {
      const filterDto: FilterPropertiesDto = { skip: 0 };

      mockPropertiesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto, mockUser);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('should return a single property by id', async () => {
      const propertyId = 'property-123';
      const mockProperty = {
        id: propertyId,
        address: '123 Main Street',
        city: 'Hanoi',
        landlordId: 'landlord-123',
      };

      mockPropertiesService.findOne.mockResolvedValue(mockProperty);

      const result = await controller.findOne(propertyId);

      expect(result).toEqual(mockProperty);
      expect(service.findOne).toHaveBeenCalledWith(propertyId);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-123';
      const updateDto: UpdatePropertyDto = {
        address: '789 New Street',
        name: 'Sunset Apartments',
      };

      const mockUpdatedProperty = {
        id: propertyId,
        landlordId: 'landlord-123',
        ...updateDto,
        city: 'Hanoi',
        ward: 'Ba Dinh',
        propertyType: PropertyType.APARTMENT,
      };

      mockPropertiesService.update.mockResolvedValue(mockUpdatedProperty);

      const result = await controller.update(propertyId, updateDto, mockUser);

      expect(result).toEqual(mockUpdatedProperty);
      expect(service.update).toHaveBeenCalledWith(propertyId, updateDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a property', async () => {
      const propertyId = 'property-123';

      mockPropertiesService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(propertyId, mockUser);

      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(propertyId, mockUser);
    });
  });
});
