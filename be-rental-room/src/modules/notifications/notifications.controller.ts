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
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  FilterNotificationsDto,
} from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @Auth(UserRole.ADMIN)
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Get()
  @Auth()
  findAll(@Query() filterDto: FilterNotificationsDto) {
    return this.notificationsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateDto);
  }

  @Patch(':id/mark-as-read')
  @Auth()
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('user/:userId/mark-all-as-read')
  @Auth()
  async markAllAsRead(@Param('userId') userId: string) {
    // Mark all unread notifications for this user as read
    const notifications = await this.notificationsService.findAll({
      userId,
      isRead: false,
      skip: 0,
      limit: 1000, // Get all unread
    });

    await Promise.all(
      notifications.data.map((n) => this.notificationsService.markAsRead(n.id)),
    );

    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
