import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  FilterNotificationsDto,
} from './dto';
import { UserRole } from '../users/entities';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // 🔒 SECURITY: Pass userId for ownership validation
    return this.notificationsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
    @CurrentUser() user: any,
  ) {
    // 🔒 SECURITY: Users can only update their own notifications
    // Admins pass user context for validation
    return this.notificationsService.update(id, updateDto, user?.id);
  }

  @Patch(':id/mark-as-read')
  @Auth()
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    // 🔒 SECURITY: Users can only mark their own notifications as read
    return this.notificationsService.markAsRead(id, user?.id);
  }

  @Patch('user/:userId/mark-all-as-read')
  @Auth()
  async markAllAsRead(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    // 🔒 SECURITY: Users can only mark their own notifications as read
    if (user?.id !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    // Mark all unread notifications for this user as read
    const notifications = await this.notificationsService.findAll({
      userId,
      isRead: false,
      skip: 0,
      limit: 1000, // Get all unread
    });

    await Promise.all(
      notifications.data.map((n) =>
        this.notificationsService.markAsRead(n.id, user?.id),
      ),
    );

    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    // 🔒 SECURITY: Users can only delete their own notifications
    return this.notificationsService.remove(id, user?.id);
  }
}
