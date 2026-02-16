import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
// NOTE: UsersSerivce could also be broken up in to use-cases
import { UsersService } from './users.service';
import { KnexService } from 'src/shared/knex/knex.service';
import UsersRepo from './domain/user.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, KnexService, UsersRepo],
  exports: [UsersService],
})
export class UsersModule { }
