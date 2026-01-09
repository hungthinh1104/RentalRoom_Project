import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import {
  CreateRoomDto,
  FilterRoomsDto,
  UpdateRoomDto,
  ReplyToReviewDto,
  CreateReviewDto,
} from './dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

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

  @Get('reviews/landlord/:landlordId')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  getLandlordReviews(@Param('landlordId') landlordId: string) {
    return this.roomsService.getReviewsByLandlord(landlordId);
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
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() user: User,
  ) {
    return this.roomsService.update(id, updateRoomDto, user);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.roomsService.remove(id, user);
  }

  @Post('reviews/:id/reply')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  replyToReview(@Param('id') id: string, @Body() replyDto: ReplyToReviewDto) {
    return this.roomsService.replyToReview(id, replyDto);
  }

  @Post('reviews')
  @Auth(UserRole.TENANT)
  createReview(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.roomsService.createReview(createReviewDto, user.id);
  }
}
