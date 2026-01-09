import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

export interface RoomFeatures {
  priceGap: number | null; // % difference from median in area
  onTimePaymentRate: number | null; // 0-1
  avgStayMonths: number | null;
  disputeCount: number;
  maintenanceFrequency: number; // requests per month
  landlordResponseTime: number | null; // avg days to resolve
}

@Injectable()
export class FeatureStoreService {
  private readonly logger = new Logger(FeatureStoreService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate all 6 fact-based features for a room
   * Uses ONLY historical data from snapshots/contracts/payments
   */
  async calculateRoomFeatures(roomId: string): Promise<RoomFeatures> {
    try {
      const [
        priceGap,
        onTimePaymentRate,
        avgStayMonths,
        disputeCount,
        maintenanceFrequency,
        landlordResponseTime,
      ] = await Promise.all([
        this.calcPriceGap(roomId),
        this.calcOnTimePaymentRate(roomId),
        this.calcAvgStayMonths(roomId),
        this.calcDisputeCount(roomId),
        this.calcMaintenanceFrequency(roomId),
        this.calcLandlordResponseTime(roomId),
      ]);

      return {
        priceGap,
        onTimePaymentRate,
        avgStayMonths,
        disputeCount,
        maintenanceFrequency,
        landlordResponseTime,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate features for room ${roomId}`,
        error,
      );
      return this.getEmptyFeatures();
    }
  }

  /**
   * Price Gap: % difference from median price in same city
   */
  private async calcPriceGap(roomId: string): Promise<number | null> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: {
          select: { city: true },
        },
      },
    });

    if (!room) return null;

    // Get median price in same city
    const roomsInCity = await this.prisma.room.findMany({
      where: {
        property: {
          city: room.property.city,
        },
        status: 'AVAILABLE',
      },
      select: {
        pricePerMonth: true,
      },
    });

    if (roomsInCity.length === 0) return null;

    const prices = roomsInCity
      .map((r) => Number(r.pricePerMonth))
      .sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];

    const gap = ((Number(room.pricePerMonth) - median) / median) * 100;
    return Math.round(gap * 100) / 100; // Round to 2 decimals
  }

  /**
   * On-Time Payment Rate: % of payments made before or on due date
   */
  private async calcOnTimePaymentRate(roomId: string): Promise<number | null> {
    const payments = await this.prisma.payment.findMany({
      where: {
        invoice: {
          contract: {
            roomId,
          },
        },
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          select: {
            dueDate: true,
          },
        },
      },
    });

    if (payments.length === 0) return null;

    const onTimeCount = payments.filter(
      (p) => p.paidAt && p.paidAt <= p.invoice.dueDate,
    ).length;

    return onTimeCount / payments.length;
  }

  /**
   * Average Stay: Average contract duration in months
   */
  private async calcAvgStayMonths(roomId: string): Promise<number | null> {
    const contracts = await this.prisma.contract.findMany({
      where: {
        roomId,
        status: { in: ['TERMINATED', 'EXPIRED'] },
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    if (contracts.length === 0) return null;

    const totalMonths = contracts.reduce((sum, c) => {
      const months =
        (c.endDate.getTime() - c.startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      return sum + months;
    }, 0);

    return Math.round((totalMonths / contracts.length) * 10) / 10;
  }

  /**
   * Dispute Count: Number of disputes for this room
   * Note: Assumes you have a Dispute model. If not, return 0.
   */
  private async calcDisputeCount(roomId: string): Promise<number> {
    // TODO: Implement when Dispute model exists
    // For now, return 0 (no disputes tracked yet)
    return 0;
  }

  /**
   * Maintenance Frequency: Average requests per month
   */
  private async calcMaintenanceFrequency(roomId: string): Promise<number> {
    // MaintenanceRequest schema has contractId, need to find via contract
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        roomId,
      },
      select: {
        createdAt: true,
      },
    });

    if (requests.length === 0) return 0;

    // Calculate months since first request
    const firstRequest = requests.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];
    const monthsSinceFirst =
      (Date.now() - firstRequest.createdAt.getTime()) /
      (1000 * 60 * 60 * 24 * 30);

    if (monthsSinceFirst < 1) return requests.length; // Less than a month

    return Math.round((requests.length / monthsSinceFirst) * 10) / 10;
  }

  /**
   * Landlord Response Time: Average days to resolve maintenance
   */
  private async calcLandlordResponseTime(
    roomId: string,
  ): Promise<number | null> {
    const resolved = await this.prisma.maintenanceRequest.findMany({
      where: {
        roomId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    if (resolved.length === 0) return null;

    const totalDays = resolved.reduce((sum, r) => {
      const days =
        (r.completedAt!.getTime() - r.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round((totalDays / resolved.length) * 10) / 10;
  }

  /**
   * Return empty features (all null/0) when no data
   */
  private getEmptyFeatures(): RoomFeatures {
    return {
      priceGap: null,
      onTimePaymentRate: null,
      avgStayMonths: null,
      disputeCount: 0,
      maintenanceFrequency: 0,
      landlordResponseTime: null,
    };
  }
}
