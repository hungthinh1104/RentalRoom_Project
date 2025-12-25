import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { AdminReportService } from './services/admin-report.service';
import { LandlordReportService } from './services/landlord-report.service';
import { TenantReportService } from './services/tenant-report.service';
import { CacheModule } from '@nestjs/cache-manager';

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [ReportsController],
      providers: [
        {
          provide: AdminReportService,
          useValue: {
            getAdminOverview: jest.fn(),
            getAdminMarketInsights: jest.fn(),
            getLandlordRatings: jest.fn(),
          },
        },
        {
          provide: LandlordReportService,
          useValue: {
            getLandlordRevenue: jest.fn(),
            getPropertyPerformance: jest.fn(),
            getTenantAnalytics: jest.fn(),
            getLandlordDashboardSummary: jest.fn(),
          },
        },
        {
          provide: TenantReportService,
          useValue: {
            getTenantPaymentHistory: jest.fn(),
            getTenantExpenses: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
