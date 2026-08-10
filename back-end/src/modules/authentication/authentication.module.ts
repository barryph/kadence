import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthenticationService } from './services/authentication.service';
import { SocialAuthService } from './services/social-auth.service';
import { ExternalIdentityService } from './services/external-identity.service';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { EMAIL_SENDER } from './ports/email-sender.port';
import { NoopEmailSender } from './infrastructure/noop-email-sender';
import { GoogleProvider } from './infrastructure/providers/google.provider';
import { AppleProvider } from './infrastructure/providers/apple.provider';
import ExternalIdentitiesRepo from './repos/external-identities.repository';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    SocialAuthService,
    ExternalIdentityService,
    GoogleProvider,
    AppleProvider,
    ExternalIdentitiesRepo,
    {
      provide: EMAIL_SENDER,
      useClass: NoopEmailSender,
    },
  ],
})
export class AuthenticaitonModule {}
