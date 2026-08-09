import ActivityGoal from '../../src/modules/activity-goals/domain/activityGoal.entity';
import ActivityGoalsRepo from '../../src/modules/activity-goals/repos/activityGoals.repository';
import { KnexService } from '../../src/shared/knex/knex.service';

export interface ActivityGoalFactoryOverrides {
  activityId: string;
  targetPerWeek?: number;
}

export function buildActivityGoal(
  overrides: ActivityGoalFactoryOverrides,
): ActivityGoal {
  return ActivityGoal.createNew({
    activityId: overrides.activityId,
    targetPerWeek: overrides.targetPerWeek ?? 3,
  });
}

export async function insertActivityGoal(
  knexService: KnexService,
  overrides: ActivityGoalFactoryOverrides,
): Promise<ActivityGoal> {
  const repo = new ActivityGoalsRepo(knexService);
  return repo.create(buildActivityGoal(overrides));
}
