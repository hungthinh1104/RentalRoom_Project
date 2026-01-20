import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DisputeService } from './dispute.service';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputeController {
  constructor(private disputeService: DisputeService) {}

  /**
   * POST /disputes
   * Create new dispute from tenant or landlord
   */
  @Post()
  async createDispute(@Body() dto: any, @Req() req: any) {
    return this.disputeService.createDispute(dto, req.user.id);
  }

  /**
   * GET /disputes/:id
   * Get dispute details with evidence timeline
   */
  @Get(':id')
  async getDispute(@Param('id') disputeId: string, @Req() req: any) {
    return this.disputeService.getDispute(disputeId, req.user.id);
  }

  /**
   * PATCH /disputes/:id/counter-evidence
   * Submit counter-evidence as respondent
   */
  @Patch(':id/counter-evidence')
  async submitCounterEvidence(
    @Param('id') disputeId: string,
    @Body() dto: { evidenceUrls: string[] },
    @Req() req: any,
  ) {
    return this.disputeService.submitCounterEvidence(disputeId, dto, req.user.id);
  }

  /**
   * PATCH /disputes/:id/resolve
   * Admin resolves dispute with decision
   */
  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async resolveDispute(
    @Param('id') disputeId: string,
    @Body()
    dto: {
      resolution: 'APPROVED' | 'REJECTED' | 'PARTIAL';
      approvedAmount: number;
      reason: string;
    },
    @Req() req: any,
  ) {
    return this.disputeService.resolveDispute(disputeId, dto, req.user.id);
  }

  /**
   * PATCH /disputes/:id/escalate
   * Admin escalates to legal/offline handling
   */
  @Patch(':id/escalate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async escalateDispute(
    @Param('id') disputeId: string,
    @Body() dto: { reason: string },
    @Req() req: any,
  ) {
    return this.disputeService.escalateDispute(
      disputeId,
      dto.reason,
      req.user.id,
    );
  }
}
