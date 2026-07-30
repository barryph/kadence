import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import UsersRepo from './repos/user.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepo],
  exports: [UsersService, UsersRepo],
})
export class UsersModule {}
