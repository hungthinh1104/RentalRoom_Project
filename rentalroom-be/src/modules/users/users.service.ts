import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

interface FindAllParams {
  search?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(params?: FindAllParams) {
    const { search, role, emailVerified } = params || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        isBanned: true,
        bannedAt: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        tenant: true,
        landlord: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, fullName, phoneNumber, role } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phoneNumber,
        role,
        emailVerified: false,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create associated profile based on role
    if (role === UserRole.TENANT) {
      await this.prisma.tenant.create({
        data: { userId: user.id },
      });
    } else if (role === UserRole.LANDLORD) {
      await this.prisma.landlord.create({
        data: { userId: user.id },
      });
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, email, role, ...rest } = updateUserDto;

    // Prevent email change
    if (email && email !== user.email) {
      throw new BadRequestException('Cannot change email');
    }

    const data: any = { ...rest };

    // Hash password if provided
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    // Handle role change
    if (role && role !== user.role) {
      await this.handleRoleChange(id, user.role, role);
      data.role = role;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(id: string, newRole: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === newRole) {
      return user; // No change needed
    }

    await this.handleRoleChange(id, user.role, newRole);

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // 1. Upload new avatar
    const { url } = await this.uploadService.uploadFile(file, 'avatars');

    // 2. Get old user to delete old avatar logic (Optional optimization)
    // const user = await this.findOne(userId);
    // if (user.avatarUrl && user.avatarUrl.includes('imagekit')) ...

    // 3. Update User
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        avatarUrl: true,
      },
    });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedUser.avatarUrl,
    };
  }

  private async handleRoleChange(
    userId: string,
    oldRole: UserRole,
    newRole: UserRole,
  ) {
    // Delete old role-specific profile
    if (oldRole === UserRole.TENANT) {
      await this.prisma.tenant.deleteMany({ where: { userId } });
    } else if (oldRole === UserRole.LANDLORD) {
      await this.prisma.landlord.deleteMany({ where: { userId } });
    }

    // Create new role-specific profile
    if (newRole === UserRole.TENANT) {
      await this.prisma.tenant.create({ data: { userId } });
    } else if (newRole === UserRole.LANDLORD) {
      await this.prisma.landlord.create({ data: { userId } });
    }
  }

  /**
   * Ban user - Admin only
   */
  async banUser(userId: string, reason: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isBanned) {
      throw new BadRequestException('User is already banned');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason,
        bannedBy: adminId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
      },
    });
  }

  /**
   * Unban user - Admin only
   */
  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        bannedBy: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });
  }

  /**
   * Anonymize user data for PDPL "Right to be Forgotten" compliance
   * FIX: PDPL data deletion strategy
   */
  async anonymizeUser(userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Anonymize user personal data (keep record for audit)
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: 'DELETED_USER',
          email: `deleted_${userId.substring(0, 8)}@anonymized.local`,
          phoneNumber: null,
          passwordHash: '', // Clear password
        },
      });

      // 2. Anonymize snapshots but keep for legal audit trail
      await tx.legalSnapshot.updateMany({
        where: { actorId: userId },
        data: {
          metadata: {
            anonymized: true,
            anonymizedAt: new Date().toISOString(),
          },
        },
      });

      // 3. Delete consent logs (no longer needed after anonymization)
      await tx.consentLog.deleteMany({
        where: { userId },
      });

      return { userId, anonymized: true };
    });
  }
}
