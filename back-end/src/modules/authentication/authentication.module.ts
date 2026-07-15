import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthenticationService } from './services/authentication.service';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, ForgotPasswordRateLimitGuard],
})
export class AuthenticaitonModule {}
