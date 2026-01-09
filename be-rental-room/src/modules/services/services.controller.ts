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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, FilterServicesDto } from './dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @Auth()
  findAll(@Query() filterDto: FilterServicesDto) {
    return this.servicesService.findAll(filterDto);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: User,
  ) {
    return this.servicesService.update(id, updateServiceDto, user);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.servicesService.remove(id, user);
  }
}
