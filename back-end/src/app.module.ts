import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { KnexService } from './shared/knex/knex.service';
import { AuthenticaitonModule } from './modules/authentication/authentication.module';

@Module({
  imports: [UsersModule, AuthenticaitonModule],
  controllers: [AppController],
  providers: [AppService, KnexService],
})
export class AppModule { }
