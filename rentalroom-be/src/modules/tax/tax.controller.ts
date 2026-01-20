import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { User } from '../users/entities';
import { PrismaService } from 'src/database/prisma/prisma.service';

@ApiTags('Tax & Revenue')
@ApiBearerAuth()
@Controller('tax')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxController {
  constructor(
    private taxService: TaxService,
    private prisma: PrismaService,
  ) {}

  @Get('export')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Export tax data (CSV)',
    description:
      'Export landlord revenue data with disclaimer. LANDLORD can only access their own data. ADMIN can access any landlord.',
  })
  @ApiQuery({
    name: 'landlordId',
    required: true,
    type: String,
    description: 'Landlord UUID',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    example: 2026,
    description: 'Year (2020-2100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax data exported successfully with CSV and disclaimer',
  })
  @ApiResponse({ status: 400, description: 'Invalid year parameter' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - LANDLORD can only access own data',
  })
  async exportTaxData(
    @Query('landlordId') landlordId: string,
    @Query('year') year: string,
    @CurrentUser() user: User,
  ) {
    // SECURITY: IDOR protection - LANDLORD can only access their own data
    if (user.role === UserRole.LANDLORD) {
      const landlord = await this.prisma.landlord.findUnique({
        where: { userId: user.id },
      });

      if (!landlord || landlord.userId !== landlordId) {
        throw new ForbiddenException('You can only access your own tax data');
      }
    }

    // Input validation
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestException('Invalid year parameter');
    }

    return this.taxService.exportTaxData(
      landlordId,
      yearNum,
      user.id,
      user.role,
    );
  }

  @Get('snapshot/:landlordId/:year/:month')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate monthly revenue snapshot',
    description:
      'Pre-calculate monthly revenue for tax dashboard. LANDLORD can only access their own data.',
  })
  @ApiParam({ name: 'landlordId', type: String, description: 'Landlord UUID' })
  @ApiParam({
    name: 'year',
    type: Number,
    example: 2026,
    description: 'Year (2020-2100)',
  })
  @ApiParam({
    name: 'month',
    type: Number,
    example: 1,
    description: 'Month (1-12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly snapshot generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid year or month parameter' })
  @ApiResponse({
    status: 403,
    description: 'Access denied - LANDLORD can only access own data',
  })
  async getMonthlySnapshot(
    @Param('landlordId') landlordId: string,
    @Param('year') year: string,
    @Param('month') month: string,
    @CurrentUser() user: User,
  ) {
    // SECURITY: IDOR protection - LANDLORD can only access their own data
    if (user.role === UserRole.LANDLORD) {
      const landlord = await this.prisma.landlord.findUnique({
        where: { userId: user.id },
      });

      if (!landlord || landlord.userId !== landlordId) {
        throw new ForbiddenException('You can only access your own tax data');
      }
    }

    // Input validation
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      throw new BadRequestException('Invalid year parameter');
    }

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Invalid month parameter (1-12)');
    }

    return this.taxService.generateMonthlySnapshot(
      landlordId,
      yearNum,
      monthNum,
    );
  }
}
