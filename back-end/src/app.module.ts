import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './shared/knex/database.module';
import { AuthenticaitonModule } from './modules/authentication/authentication.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthenticaitonModule,
    ActivitiesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
