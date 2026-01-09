import {
  Controller,
  Get,
  Param,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SnapshotService } from './snapshot.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin - Legal Snapshots')
@ApiBearerAuth()
@Controller('admin/snapshots')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SnapshotsController {
  private readonly VALID_ENTITY_TYPES = [
    'CONTRACT',
    'PAYMENT',
    'CONSENT',
    'MAINTENANCE',
  ];
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private snapshotService: SnapshotService) { }

  @Get()
  @ApiOperation({
    summary: 'Get all snapshots (Audit Logs)',
    description: 'Retrieve system-wide audit logs with filtering and pagination. Admin only.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'actionType', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'actorId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('actionType') actionType?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const skip = ((page || 1) - 1) * (limit || 20);
    const take = Number(limit) || 20;

    return this.snapshotService.findAll({
      skip,
      take,
      actionType,
      entityType,
      actorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get snapshots by entity',
    description: 'Retrieve all legal snapshots for a specific entity (CONTRACT, PAYMENT, CONSENT, MAINTENANCE). Admin only.'
  })
  @ApiParam({ name: 'entityType', enum: ['CONTRACT', 'PAYMENT', 'CONSENT', 'MAINTENANCE'], description: 'Entity type' })
  @ApiParam({ name: 'entityId', type: String, description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Snapshots retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid entity type or ID format' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    // Validate entity type (whitelist)
    if (!this.VALID_ENTITY_TYPES.includes(entityType.toUpperCase())) {
      throw new BadRequestException(
        `Invalid entity type. Must be one of: ${this.VALID_ENTITY_TYPES.join(', ')}`,
      );
    }

    // Validate entity ID (UUID format)
    if (!this.UUID_REGEX.test(entityId)) {
      throw new BadRequestException('Invalid entity ID format (must be UUID)');
    }

    return this.snapshotService.findByEntity(entityType, entityId);
  }

  @Get(':id/verify')
  @ApiOperation({
    summary: 'Verify snapshot integrity',
    description: 'Verify that snapshot hash has not been tampered with. Returns boolean validation result.'
  })
  @ApiParam({ name: 'id', type: String, description: 'Snapshot UUID' })
  @ApiResponse({ status: 200, description: 'Snapshot verified successfully', schema: { example: { id: 'uuid', isValid: true, timestamp: '2026-01-07T...' } } })
  @ApiResponse({ status: 400, description: 'Invalid snapshot ID format' })
  async verify(@Param('id') id: string) {
    // Validate snapshot ID (UUID format)
    if (!this.UUID_REGEX.test(id)) {
      throw new BadRequestException(
        'Invalid snapshot ID format (must be UUID)',
      );
    }

    const isValid = await this.snapshotService.verify(id);
    return { id, isValid, timestamp: new Date() };
  }
}
