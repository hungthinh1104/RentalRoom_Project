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
import { LandlordsService } from './landlords.service';
import {
  CreateLandlordDto,
  UpdateLandlordDto,
  FilterLandlordsDto,
} from './dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@Controller('landlords')
export class LandlordsController {
  constructor(private readonly landlordsService: LandlordsService) {}

  @Post()
  @Auth(UserRole.ADMIN)
  create(@Body() createLandlordDto: CreateLandlordDto) {
    return this.landlordsService.create(createLandlordDto);
  }

  @Get()
  @Auth(UserRole.ADMIN)
  findAll(@Query() filterDto: FilterLandlordsDto) {
    return this.landlordsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.landlordsService.findOne(id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() updateLandlordDto: UpdateLandlordDto,
  ) {
    return this.landlordsService.update(id, updateLandlordDto);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.landlordsService.remove(id);
  }
}
