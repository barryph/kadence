import { Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './activities.controller';
import ActivitiesRepo from './repos/activities.repository';
import ActivityEventRepo from './repos/activityEvent.repository';
import { KnexService } from 'src/shared/knex/knex.service';
import { GetActivitiesByUserIdQuery } from './queries/getActivitiesByUserId.query';
import { GetActivityTimelineQuery } from '../queries/getActivityTimeline.query';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesRepo,
    ActivityEventRepo,
    KnexService,
    GetActivitiesByUserIdQuery,
    GetActivityTimelineQuery,
  ],
})
export class ActivitiesModule { }
