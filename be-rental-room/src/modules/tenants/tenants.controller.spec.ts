import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, FilterTenantsDto } from './dto';

describe('TenantsController', () => {
  let controller: TenantsController;
  let service: TenantsService;

  const mockTenantsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createDto: CreateTenantDto = {
        userId: 'user-123',
        fullName: 'John Doe',
        phoneNumber: '+84987654321',
        email: 'john@example.com',
        emergencyContact: 'Jane Emergency',
      };

      const mockCreatedTenant = {
        id: 'tenant-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTenantsService.create.mockResolvedValue(mockCreatedTenant);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedTenant);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all tenants with filter', async () => {
      const filterDto: FilterTenantsDto = {
        skip: 0,
      };

      const mockTenants = [
        { id: 'tenant-1', userId: 'user-1' },
        { id: 'tenant-2', userId: 'user-2' },
      ];

      mockTenantsService.findAll.mockResolvedValue(mockTenants);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockTenants);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should return empty array when no tenants match', async () => {
      const filterDto: FilterTenantsDto = { skip: 0 };

      mockTenantsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('should return a single tenant by id', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        userId: 'user-123',
        emergencyContact: 'John Emergency',
      };

      mockTenantsService.findOne.mockResolvedValue(mockTenant);

      const result = await controller.findOne(tenantId);

      expect(result).toEqual(mockTenant);
      expect(service.findOne).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const tenantId = 'tenant-123';
      const updateDto: UpdateTenantDto = {
        emergencyContact: 'Jane Emergency',
        phoneNumber: '+84912345678',
      };

      const mockUpdatedTenant = {
        id: tenantId,
        userId: 'user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        ...updateDto,
      };

      mockTenantsService.update.mockResolvedValue(mockUpdatedTenant);

      const result = await controller.update(tenantId, updateDto);

      expect(result).toEqual(mockUpdatedTenant);
      expect(service.update).toHaveBeenCalledWith(tenantId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a tenant', async () => {
      const tenantId = 'tenant-123';

      mockTenantsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(tenantId);

      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(tenantId);
    });
  });
});
