import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  FilterMaintenanceRequestsDto,
  CreateMaintenanceFeedbackDto,
} from './dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) { }

  @Post('requests')
  @Auth()
  create(@Body() createDto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.create(createDto);
  }

  @Get('requests')
  @Auth()
  findAll(@Query() filterDto: FilterMaintenanceRequestsDto) {
    return this.maintenanceService.findAll(filterDto);
  }

  @Get('requests/:id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch('requests/:id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.update(id, updateDto, user);
  }

  @Patch('requests/:id/complete')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  complete(@Param('id') id: string) {
    return this.maintenanceService.complete(id);
  }

  @Delete('requests/:id')
  @Auth(UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.maintenanceService.remove(id, user);
  }

  @Patch('requests/:id/feedback')
  @Auth()
  submitFeedback(
    @Param('id') id: string,
    @Body() feedbackDto: CreateMaintenanceFeedbackDto,
  ) {
    return this.maintenanceService.submitFeedback(id, feedbackDto);
  }
}
