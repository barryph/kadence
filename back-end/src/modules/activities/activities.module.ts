import { Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './activities.controller';
import ActivitiesRepo from './repos/activities.repository';
import ActivityEventRepo from './repos/activityEvent.repository';
import { GetActivitiesByUserIdQuery } from './queries/getActivitiesByUserId.query';
import { GetActivityByIdQuery } from './queries/getActivityById.query';
import { GetActivityTimelineQuery } from './queries/getActivityTimeline.query';
import { GetActivityEventsQuery } from './queries/getActivityEvents.query';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesRepo,
    ActivityEventRepo,
    GetActivitiesByUserIdQuery,
    GetActivityByIdQuery,
    GetActivityTimelineQuery,
    GetActivityEventsQuery,
  ],
})
export class ActivitiesModule {}
