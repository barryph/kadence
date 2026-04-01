import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
// NOTE: UsersSerivce could also be broken up into use-cases
import { UsersService } from './services/users.service';
import { KnexService } from 'src/shared/knex/knex.service';
import UsersRepo from './repos/user.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, KnexService, UsersRepo],
  exports: [UsersService],
})
export class UsersModule {}
