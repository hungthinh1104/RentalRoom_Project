import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { EmailService } from 'src/common/services/email.service';
import { eKycModule } from 'src/shared/integration/ekyc/ekyc.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}), // Config will be in strategy
    eKycModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    LocalStrategy,
    EmailService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
