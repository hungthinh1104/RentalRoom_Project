import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth(UserRole.ADMIN) // Require authentication for admin roles
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth(UserRole.ADMIN) // Require authentication for admin roles
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
