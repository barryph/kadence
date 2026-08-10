import { Matches } from 'class-validator';
import { ActivityGoalDTO } from '../mappers/activityGoalMap';

export default class GetGoalsQueryDTO {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'today must be in YYYY-MM-DD format',
  })
  today: string;
}

export interface GoalProgressDTO {
  goalId: string;
  activityId: string;
  activityName: string;
  targetPerWeek: number;
  currentWeekCount: number;
  categoryColor?: string | null;
}

export interface GoalWeeklyPoint {
  weekStart: string;
  count: number;
}

export interface GoalAdherenceDTO {
  applicable: number;
  met: number;
  /** Fraction 0..1, or null when there are no applicable weeks */
  percentage: number | null;
}

export interface GoalStatsDTO {
  goal: ActivityGoalDTO;
  activityName: string;
  currentWeekCount: number;
  weeklyPerformance: GoalWeeklyPoint[];
  adherence: GoalAdherenceDTO;
  heatmap: GoalWeeklyPoint[];
  firstCompletionDate: string | null;
}
