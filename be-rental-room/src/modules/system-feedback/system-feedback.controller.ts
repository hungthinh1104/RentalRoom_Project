import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SystemFeedbackService } from './system-feedback.service';
import {
  CreateSystemFeedbackDto,
  UpdateFeedbackStatusDto,
} from './dto/system-feedback.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('System Feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemFeedbackController {
  constructor(private readonly feedbackService: SystemFeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit new system feedback' })
  create(
    @CurrentUser() user: User,
    @Body() createFeedbackDto: CreateSystemFeedbackDto,
  ) {
    return this.feedbackService.create(user.id, createFeedbackDto);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all feedback (Admin only)' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
  ) {
    const where = status ? { status: status as any } : {};
    return this.feedbackService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update feedback status (Admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateStatus(id, updateStatusDto);
  }
}
