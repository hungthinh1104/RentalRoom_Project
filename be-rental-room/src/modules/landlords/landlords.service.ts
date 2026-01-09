import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { UserRole, User } from '@prisma/client';
import {
  CreateLandlordDto,
  UpdateLandlordDto,
  FilterLandlordsDto,
  LandlordResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';

@Injectable()
export class LandlordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLandlordDto: CreateLandlordDto) {
    const landlord = await this.prisma.landlord.create({
      data: createLandlordDto,
    });

    return plainToClass(LandlordResponseDto, landlord, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterLandlordsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      search,
    } = filterDto;

    const where: any = {};

    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { citizenId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [landlords, total] = await Promise.all([
      this.prisma.landlord.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.landlord.count({ where }),
    ]);

    const transformedLandlords = landlords.map((landlord) =>
      plainToClass(LandlordResponseDto, landlord, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformedLandlords, total, page, limit);
  }

  async findOne(id: string) {
    const landlord = await this.prisma.landlord.findUnique({
      where: { userId: id },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord with ID ${id} not found`);
    }

    return plainToClass(LandlordResponseDto, landlord, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateLandlordDto: UpdateLandlordDto, user: User) {
    await this.findOne(id); // Check existence

    // 🔒 SECURITY: Landlord can only update own profile
    if (user.role === UserRole.LANDLORD && id !== user.id) {
      throw new BadRequestException(
        'Landlords can only update their own profile',
      );
    }

    const landlord = await this.prisma.landlord.update({
      where: { userId: id },
      data: updateLandlordDto,
    });

    return plainToClass(LandlordResponseDto, landlord, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    await this.prisma.landlord.delete({
      where: { userId: id },
    });

    return { message: 'Landlord deleted successfully' };
  }
}
