import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
    AdminOverviewQueryDto,
    AdminOverviewResponseDto,
    AdminMarketInsightsQueryDto,
    AdminMarketInsightsResponseDto,
    MarketPriceDto,
    PopularSearchDto,
    LandlordRatingResponseDto,
    LandlordRatingQueryDto,
    PaginatedLandlordRatingResponseDto,
} from '../dto/admin-report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminReportService {
    private readonly logger = new Logger(AdminReportService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get platform overview for admins
     */
    async getAdminOverview(
        query: AdminOverviewQueryDto,
    ): Promise<AdminOverviewResponseDto> {
        const { period: _period = 'monthly', periods: _periods = 6 } = query;
        void _period;
        void _periods;

        // Get current summary statistics
        const [
            totalUsers,
            totalTenants,
            totalLandlords,
            totalProperties,
            totalRooms,
            activeContracts,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.tenant.count(),
            this.prisma.landlord.count(),
            this.prisma.property.count(),
            this.prisma.room.count(),
            this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
        ]);

        // Calculate platform revenue and occupancy
        const [revenueData, occupancyData] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.room.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        const platformRevenue = Number(revenueData._sum.amount || 0);
        const occupiedRooms =
            occupancyData.find((g) => g.status === 'OCCUPIED')?._count || 0;
        const averageOccupancy =
            totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Get top performers
        const topLandlords = await this.prisma.$queryRaw<
            Array<{
                landlordId: string;
                name: string;
                properties: number;
                revenue: number;
                occupancyRate: number;
            }>
        >`
      SELECT 
        l.user_id as "landlordId",
        u.full_name as "name",
        COUNT(DISTINCT p.id)::int as properties,
        COALESCE(SUM(pay.amount), 0)::decimal as revenue,
        COALESCE(AVG(
          CASE WHEN r.status = 'OCCUPIED' THEN 100.0 ELSE 0.0 END
        ), 0)::decimal as "occupancyRate"
      FROM landlord l
      JOIN "user" u ON l.user_id = u.id
      LEFT JOIN property p ON l.user_id = p.landlord_id
      LEFT JOIN room r ON p.id = r.property_id
      LEFT JOIN contract c ON r.id = c.room_id AND c.status = 'ACTIVE'
      LEFT JOIN invoice i ON c.id = i.contract_id
      LEFT JOIN payment pay ON i.id = pay.invoice_id AND pay.status = 'COMPLETED'
      GROUP BY l.user_id, u.full_name
      ORDER BY revenue DESC, "occupancyRate" DESC
      LIMIT 5
    `;

        const topProperties = await this.prisma.$queryRaw<
            Array<{
                propertyId: string;
                name: string;
                landlord: string;
                occupancyRate: number;
                revenue: number;
            }>
        >`
      SELECT 
        p.id as "propertyId",
        p.name,
        u.full_name as landlord,
        COALESCE(
          (COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END)::decimal / 
           NULLIF(COUNT(r.id), 0) * 100),
          0
        )::decimal as "occupancyRate",
        COALESCE(SUM(pay.amount), 0)::decimal as revenue
      FROM property p
      JOIN landlord l ON p.landlord_id = l.user_id
      JOIN "user" u ON l.user_id = u.id
      LEFT JOIN room r ON p.id = r.property_id
      LEFT JOIN contract c ON r.id = c.room_id AND c.status = 'ACTIVE'
      LEFT JOIN invoice i ON c.id = i.contract_id
      LEFT JOIN payment pay ON i.id = pay.invoice_id AND pay.status = 'COMPLETED'
      GROUP BY p.id, p.name, u.full_name
      ORDER BY "occupancyRate" DESC, revenue DESC
      LIMIT 5
    `;

        return {
            summary: {
                totalUsers,
                totalTenants,
                totalLandlords,
                totalProperties,
                totalRooms,
                activeContracts,
                platformRevenue,
                averageOccupancy,
            },
            trends: [], // TODO: Implement time-series trends based on period
            topPerformers: {
                landlords: topLandlords.map((l) => ({
                    ...l,
                    revenue: Number(l.revenue),
                    occupancyRate: Number(l.occupancyRate),
                })),
                properties: topProperties.map((p) => ({
                    ...p,
                    occupancyRate: Number(p.occupancyRate),
                    revenue: Number(p.revenue),
                })),
            },
        };
    }

    /**
     * Get market insights for admins
     * Uses materialized view: popular_searches_mv
     */
    async getAdminMarketInsights(
        query: AdminMarketInsightsQueryDto,
    ): Promise<AdminMarketInsightsResponseDto> {
        const { city, ward } = query;

        try {
            // Price analysis by location and property type
            const priceAnalysis = await this.prisma.$queryRaw<MarketPriceDto[]>`
        SELECT 
          p.property_type as "propertyType",
          p.city,
          p.ward,
          AVG(r.price_per_month)::decimal as "averagePrice",
          MIN(r.price_per_month)::decimal as "minPrice",
          MAX(r.price_per_month)::decimal as "maxPrice",
          COUNT(r.id)::int as "totalListings",
          COALESCE(
            (COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END)::decimal / 
             NULLIF(COUNT(r.id), 0) * 100),
            0
          )::decimal as "occupancyRate"
        FROM property p
        JOIN room r ON p.id = r.property_id
        WHERE 1=1
        ${city ? Prisma.sql`AND p.city = ${city}` : Prisma.empty}
${ward ? Prisma.sql`AND p.ward = ${ward}` : Prisma.empty}
      GROUP BY p.property_type, p.city, p.ward
        ORDER BY "averagePrice" DESC
      `;

            // Get popular searches from materialized view
            const popularSearches = await this.prisma.$queryRaw<PopularSearchDto[]>`
        SELECT 
          query,
          search_count as "searchCount",
          last_searched::text as "lastSearched"
        FROM popular_searches_mv
        ORDER BY search_count DESC, last_searched DESC
        LIMIT 10
      `;

            // Calculate demand metrics
            const [totalSearches, totalApplications, avgTimeToBook] =
                await Promise.all([
                    this.prisma.popularSearch.aggregate({
                        _sum: { searchCount: true },
                    }),
                    this.prisma.rentalApplication.count(),
                    this.prisma.$queryRaw<[{ avgDays: number }]>`
          SELECT AVG(
            EXTRACT(DAY FROM (c.signed_at - ra.created_at))
          )::decimal as "avgDays"
          FROM rental_application ra
          JOIN contract c ON ra.id = c.application_id
          WHERE c.signed_at IS NOT NULL
        `,
                ]);

            const demandMetrics = {
                totalSearches: Number(totalSearches._sum.searchCount || 0),
                totalApplications,
                conversionRate:
                    totalApplications > 0
                        ? (totalApplications /
                            Number(totalSearches._sum.searchCount || 1)) *
                        100
                        : 0,
                averageTimeToBook: Number(avgTimeToBook[0]?.avgDays || 0),
            };

            // Generate recommendations
            const recommendations: string[] = [];
            if (demandMetrics.conversionRate < 10) {
                recommendations.push(
                    'Low conversion rate detected. Consider improving property listings quality.',
                );
            }
            if (demandMetrics.averageTimeToBook > 14) {
                recommendations.push(
                    'Long booking time. Streamline application approval process.',
                );
            }

            return {
                priceAnalysis: priceAnalysis.map((p) => ({
                    ...p,
                    averagePrice: Number(p.averagePrice),
                    minPrice: Number(p.minPrice),
                    maxPrice: Number(p.maxPrice),
                    occupancyRate: Number(p.occupancyRate),
                })),
                popularSearches,
                demandMetrics,
                recommendations,
            };
        } catch (err) {
            this.logger.error('Failed to compute market insights', err as Error);
            throw new InternalServerErrorException(
                'Failed to compute market insights',
            );
        }
    }

    /**
     * Get landlord ratings for admin with Pagination
     */
    async getLandlordRatings(
        page: number = 1,
        limit: number = 10,
        search?: string,
    ): Promise<PaginatedLandlordRatingResponseDto> {
        const offset = (page - 1) * limit;

        const searchCondition = search ? `AND u.full_name ILIKE $1` : '';

        const countQuery = `
      SELECT COUNT(DISTINCT l.user_id)::int as total
      FROM room_review r
      JOIN contract c ON r.contract_id = c.id
      JOIN landlord l ON c.landlord_id = l.user_id
      JOIN "user" u ON l.user_id = u.id
      WHERE 1=1
      ${searchCondition}
    `;

        const countParams: any[] = search ? [`%${search}%`] : [];

        const totalResult = await this.prisma.$queryRawUnsafe<[{ total: number }]>(
            countQuery,
            ...countParams
        );
        const total = Number(totalResult[0]?.total || 0);

        // 2. Get Data
        let queryParams: any[] = [];
        let searchPart = '';

        if (search) {
            searchPart = `AND u.full_name ILIKE $1`;
            queryParams.push(`%${search}%`);
        }

        queryParams.push(limit);
        queryParams.push(offset);

        const limitPlaceholder = search ? '$2' : '$1';
        const offsetPlaceholder = search ? '$3' : '$2';

        const dataQuery = `
      SELECT 
        l.user_id as "landlordId",
        u.full_name as "landlordName",
        AVG(r.rating) as "averageRating",
        COUNT(r.id) as "totalRatings",
        COUNT(r.comment) as "reviewCount"
      FROM room_review r
      JOIN contract c ON r.contract_id = c.id
      JOIN landlord l ON c.landlord_id = l.user_id
      JOIN "user" u ON l.user_id = u.id
      WHERE 1=1
      ${searchPart}
      GROUP BY l.user_id, u.full_name
      ORDER BY "averageRating" DESC
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

        const ratings = await this.prisma.$queryRawUnsafe<
            Array<{
                landlordId: string;
                landlordName: string;
                averageRating: number;
                totalRatings: number;
                reviewCount: number;
            }>
        >(dataQuery, ...queryParams);

        const data = ratings.map((r) => ({
            id: r.landlordId,
            landlordId: r.landlordId,
            landlordName: r.landlordName,
            averageRating: Number(r.averageRating) || 0,
            totalRatings: Number(r.totalRatings) || 0,
            reviewCount: Number(r.reviewCount) || 0,
        }));

        return {
            data,
            total,
            page,
        };
    }
}
