import { Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './activities.controller';
import ActivitiesRepo from './repos/activities.repository';
import { KnexService } from 'src/shared/knex/knex.service';
import { GetActivitiesByUserIdQuery } from './queries/getActivitiesByUserId.query';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesRepo,
    KnexService,
    GetActivitiesByUserIdQuery,
  ],
})
export class ActivitiesModule {}
