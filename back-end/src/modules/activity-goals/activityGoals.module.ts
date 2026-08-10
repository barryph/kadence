import { Module } from '@nestjs/common';
import { ActivityGoalsController } from './activityGoals.controller';
import { ActivityGoalsService } from './services/activityGoals.service';
import ActivityGoalsRepo from './repos/activityGoals.repository';
import { GetActivityGoalsByUserIdQuery } from './queries/getActivityGoalsByUserId.query';
import { GetActivityGoalStatsQuery } from './queries/getActivityGoalStats.query';

@Module({
  controllers: [ActivityGoalsController],
  providers: [
    ActivityGoalsService,
    ActivityGoalsRepo,
    GetActivityGoalsByUserIdQuery,
    GetActivityGoalStatsQuery,
  ],
  exports: [ActivityGoalsRepo],
})
export class ActivityGoalsModule {}
