import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthenticationService } from './services/authentication.service';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';

@Module({
  imports: [UsersModule, PassportModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticaitonModule {}
