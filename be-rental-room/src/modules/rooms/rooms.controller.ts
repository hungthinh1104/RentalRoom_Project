import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { RoomsService } from './rooms.service';
import {
  CreateRoomDto,
  FilterRoomsDto,
  UpdateRoomDto,
  ReplyToReviewDto,
} from './dto';
import { CacheTTL } from '../../common/decorators/cache.decorator';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300) // Cache for 5 minutes
  findAll(@Query() filterDto: FilterRoomsDto, @CurrentUser() user: any) {
    return this.roomsService.findAll(filterDto, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(600) // Cache for 10 minutes
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roomsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @Post('reviews/:id/reply')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  replyToReview(@Param('id') id: string, @Body() replyDto: ReplyToReviewDto) {
    return this.roomsService.replyToReview(id, replyDto);
  }
}
