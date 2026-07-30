import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthenticationService } from './services/authentication.service';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { ForgotPasswordRateLimitGuard } from './guards/forgot-password-rate-limit.guard';
import { EMAIL_SENDER } from './ports/email-sender.port';
import { NoopEmailSender } from './infrastructure/noop-email-sender';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    ForgotPasswordRateLimitGuard,
    {
      provide: EMAIL_SENDER,
      useClass: NoopEmailSender,
    },
  ],
})
export class AuthenticaitonModule {}
