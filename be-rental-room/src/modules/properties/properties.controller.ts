import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  FilterPropertiesDto,
} from './dto';
import { CacheTTL } from '../../common/decorators/cache.decorator';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  @Post()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Get()
  @Auth()
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(300) // Cache for 5 minutes
  findAll(
    @Query() filterDto: FilterPropertiesDto,
    @CurrentUser() user: User,
  ) {
    // 🔒 SECURITY: Landlords can only see their own properties
    if (user.role === UserRole.LANDLORD) {
      filterDto.landlordId = user.id;
    }
    // ADMIN and TENANT can see all (for browsing)
    return this.propertiesService.findAll(filterDto);
  }

  @Get(':id')
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(600) // Cache for 10 minutes
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.remove(id, user);
  }
}
