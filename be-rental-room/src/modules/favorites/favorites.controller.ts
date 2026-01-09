import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  @Roles(UserRole.TENANT)
  @ApiOperation({ summary: 'Toggle favorite status of a room' })
  async toggle(
    @CurrentUser() user: any,
    @Body() toggleFavoriteDto: ToggleFavoriteDto,
  ) {
    return this.favoritesService.toggleFavorite(
      user.id,
      toggleFavoriteDto.roomId,
    );
  }

  @Get()
  @Roles(UserRole.TENANT)
  @ApiOperation({ summary: 'Get list of favorite rooms' })
  async findAll(@CurrentUser() user: any) {
    return this.favoritesService.getFavoriteRooms(user.id);
  }
}
