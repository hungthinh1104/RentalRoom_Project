import { Test, TestingModule } from '@nestjs/testing';
import { AdminReportService } from './admin-report.service';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('AdminReportService', () => {
    let service: AdminReportService;
    let prisma: PrismaService;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
        $queryRawUnsafe: jest.fn(),
        landlord: {
            findUnique: jest.fn(),
            count: jest.fn(),
        },
        property: { count: jest.fn() },
        room: { count: jest.fn(), groupBy: jest.fn() },
        contract: { count: jest.fn() },
        payment: { aggregate: jest.fn() },
        popularSearch: { aggregate: jest.fn() },
        rentalApplication: { count: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminReportService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AdminReportService>(AdminReportService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getLandlordRatings', () => {
        it('should return aggregated landlord ratings with pagination', async () => {
            const mockRawRatings = [
                {
                    landlordId: 'll_1',
                    landlordName: 'John Doe',
                    averageRating: 4.5,
                    totalRatings: 10,
                    reviewCount: 10,
                },
            ];
            const mockTotal = [{ total: 1 }];

            // Mock first call for count, second for data
            (prisma.$queryRawUnsafe as jest.Mock)
                .mockResolvedValueOnce(mockTotal)
                .mockResolvedValueOnce(mockRawRatings);

            const result = await service.getLandlordRatings(1, 10);

            expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(2);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].averageRating).toBe(4.5);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
        });
    });
});
