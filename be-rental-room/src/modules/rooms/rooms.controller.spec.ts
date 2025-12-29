import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, FilterRoomsDto, UpdateRoomDto } from './dto';
import { RoomStatus } from './entities/room.entity';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoomsService = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new room', async () => {
      const createDto: CreateRoomDto = {
        propertyId: 'property-1',
        roomNumber: '101',
        pricePerMonth: 5000000,
        deposit: 5000000,
        area: 25,
        status: RoomStatus.AVAILABLE,
      };

      const mockRoom = {
        id: 'room-123',
        ...createDto,
        createdAt: new Date(),
      };

      mockRoomsService.create.mockResolvedValue(mockRoom);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockRoom);
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should pass correct DTO to service', async () => {
      const createDto: CreateRoomDto = {
        propertyId: 'prop-2',
        roomNumber: '202',
        pricePerMonth: 7000000,
        deposit: 7000000,
        area: 30,
        status: RoomStatus.AVAILABLE,
      };

      mockRoomsService.create.mockResolvedValue({} as any);

      await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all rooms with filter', async () => {
      const filterDto: FilterRoomsDto = {
        status: RoomStatus.AVAILABLE,
        minPrice: 3000000,
        maxPrice: 10000000,
        skip: 0,
      };

      const mockRooms = [
        {
          id: 'room-1',
          roomNumber: '101',
          pricePerMonth: 5000000,
          status: RoomStatus.AVAILABLE,
        },
        {
          id: 'room-2',
          roomNumber: '102',
          pricePerMonth: 6000000,
          status: RoomStatus.AVAILABLE,
        },
      ];

      mockRoomsService.findAll.mockResolvedValue(mockRooms);

      const result = await controller.findAll(filterDto, null);

      expect(result).toEqual(mockRooms);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should work with minimal filter', async () => {
      const filterDto: FilterRoomsDto = {
        skip: 0,
      };

      mockRoomsService.findAll.mockResolvedValue([]);

      await controller.findAll(filterDto, null);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should return empty array when no rooms match', async () => {
      const filterDto: FilterRoomsDto = {
        status: RoomStatus.OCCUPIED,
        skip: 0,
      };

      mockRoomsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto, null);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single room by id', async () => {
      const roomId = 'room-123';
      const mockRoom = {
        id: roomId,
        roomNumber: '101',
        price: 5000000,
        area: 25,
        status: 'available',
      };

      mockRoomsService.findOne.mockResolvedValue(mockRoom);

      const result = await controller.findOne(roomId, null);

      expect(result).toEqual(mockRoom);
      expect(service.findOne).toHaveBeenCalledWith(roomId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should call service with correct id', async () => {
      const roomId = 'test-room-id';

      mockRoomsService.findOne.mockResolvedValue(null);

      await controller.findOne(roomId, null);

      expect(service.findOne).toHaveBeenCalledWith(roomId);
    });
  });

  describe('update', () => {
    it('should update a room', async () => {
      const roomId = 'room-123';
      const updateDto: UpdateRoomDto = {
        pricePerMonth: 6000000,
        status: RoomStatus.OCCUPIED,
      };

      const mockUpdatedRoom = {
        id: roomId,
        roomNumber: '101',
        pricePerMonth: 6000000,
        status: RoomStatus.OCCUPIED,
      };

      mockRoomsService.update.mockResolvedValue(mockUpdatedRoom);

      const result = await controller.update(roomId, updateDto);

      expect(result).toEqual(mockUpdatedRoom);
      expect(service.update).toHaveBeenCalledWith(roomId, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should pass id and DTO correctly', async () => {
      const roomId = 'room-456';
      const updateDto: UpdateRoomDto = {
        area: 35,
        description: 'Updated description',
      };

      mockRoomsService.update.mockResolvedValue({} as any);

      await controller.update(roomId, updateDto);

      expect(service.update).toHaveBeenCalledWith(roomId, updateDto);
    });

    it('should handle partial updates', async () => {
      const roomId = 'room-789';
      const updateDto: UpdateRoomDto = {
        deposit: 7500000,
      };

      mockRoomsService.update.mockResolvedValue({} as any);

      await controller.update(roomId, updateDto);

      expect(service.update).toHaveBeenCalledWith(roomId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a room', async () => {
      const roomId = 'room-123';

      mockRoomsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(roomId);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(roomId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should call service.remove with correct id', async () => {
      const roomId = 'room-to-delete';

      mockRoomsService.remove.mockResolvedValue(undefined);

      await controller.remove(roomId);

      expect(service.remove).toHaveBeenCalledWith(roomId);
    });

    it('should handle multiple delete operations', async () => {
      const roomIds = ['room-1', 'room-2', 'room-3'];

      for (const id of roomIds) {
        mockRoomsService.remove.mockResolvedValue(undefined);
        await controller.remove(id);
        expect(service.remove).toHaveBeenCalledWith(id);
      }
    });
  });
});
