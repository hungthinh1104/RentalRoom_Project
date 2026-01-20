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
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, FilterTenantsDto } from './dto';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { User } from '../users/entities';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Auth(UserRole.ADMIN)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  findAll(@Query() filterDto: FilterTenantsDto) {
    return this.tenantsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: User,
  ) {
    return this.tenantsService.update(id, updateTenantDto, user);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
