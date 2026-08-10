import ActivityGoal from '../domain/activityGoal.entity';

export interface ActivityGoalDTO {
  id: string;
  activityId: string;
  targetPerWeek: number;
}

export interface IActivityGoalPersistence {
  id?: string;
  activity_id: string;
  target_per_week: number;
}

export function toDTO(goal: ActivityGoal): ActivityGoalDTO {
  goal.ensurePersisted();
  return {
    id: goal.id,
    activityId: goal.activityId,
    targetPerWeek: goal.targetPerWeek,
  };
}

export function toPersistence(goal: ActivityGoal): IActivityGoalPersistence {
  return {
    ...(goal.isPersisted() && { id: goal.id }),
    activity_id: goal.activityId,
    target_per_week: goal.targetPerWeek,
  };
}

export function persistenceToDomain(
  goal: IActivityGoalPersistence,
): ActivityGoal {
  return ActivityGoal.createNew({
    id: goal.id,
    activityId: goal.activity_id,
    targetPerWeek: goal.target_per_week,
  });
}
