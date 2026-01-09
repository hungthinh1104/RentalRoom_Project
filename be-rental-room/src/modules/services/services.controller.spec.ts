import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, FilterServicesDto } from './dto';
import { ServiceType, BillingMethod } from './entities';
import { UserRole } from '@prisma/client';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  const mockServicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const createDto: CreateServiceDto = {
        propertyId: 'property-123',
        serviceName: 'Internet WiFi',
        serviceType: ServiceType.INTERNET,
        billingMethod: BillingMethod.FIXED,
        unitPrice: 200000,
      };

      const mockCreatedService = {
        id: 'service-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockServicesService.create.mockResolvedValue(mockCreatedService);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedService);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all services with filter', async () => {
      const filterDto: FilterServicesDto = {
        skip: 0,
        propertyId: 'property-123',
      };

      const mockServices = [
        { id: 'service-1', serviceName: 'Internet', unitPrice: 200000 },
        { id: 'service-2', serviceName: 'Electricity', unitPrice: 3500 },
      ];

      mockServicesService.findAll.mockResolvedValue(mockServices);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockServices);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should return empty array when no services match', async () => {
      const filterDto: FilterServicesDto = { skip: 0 };

      mockServicesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('should return a single service by id', async () => {
      const serviceId = 'service-123';
      const mockService = {
        id: serviceId,
        propertyId: 'property-123',
        serviceName: 'Internet WiFi',
        unitPrice: 200000,
      };

      mockServicesService.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne(serviceId);

      expect(result).toEqual(mockService);
      expect(service.findOne).toHaveBeenCalledWith(serviceId);
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const serviceId = 'service-123';
      const updateDto: UpdateServiceDto = {
        unitPrice: 250000,
        serviceName: 'Internet WiFi Premium',
      };

      const mockUpdatedService = {
        id: serviceId,
        propertyId: 'property-123',
        ...updateDto,
        serviceType: ServiceType.INTERNET,
        billingMethod: BillingMethod.FIXED,
      };

      mockServicesService.update.mockResolvedValue(mockUpdatedService);

      const result = await controller.update(serviceId, updateDto, mockUser);

      expect(result).toEqual(mockUpdatedService);
      expect(service.update).toHaveBeenCalledWith(serviceId, updateDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a service', async () => {
      const serviceId = 'service-123';

      mockServicesService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(serviceId, mockUser);

      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(serviceId, mockUser);
    });
  });
});
