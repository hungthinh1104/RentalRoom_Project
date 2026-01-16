import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    // 1. Gắn metadata Role (Nếu roles rỗng thì chỉ cần đăng nhập là được)
    Roles(...roles),

    // 2. Kích hoạt Guard: JWT chạy trước (lấy user) -> Roles chạy sau (check quyền)
    // Cái này giúp bạn không bao giờ bị sai thứ tự Guard
    UseGuards(JwtAuthGuard, RolesGuard),

    // 3. Config cho Swagger (Tự hiện ổ khóa & các response lỗi chuẩn)
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Chưa đăng nhập (No Token)' }),
    ApiForbiddenResponse({
      description: 'Không đủ quyền truy cập (Wrong Role)',
    }),
  );
}
