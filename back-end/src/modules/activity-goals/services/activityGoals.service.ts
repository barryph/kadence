import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computeAdherence,
  computeHeatmapWeeks,
  filterApplicableWeeks,
  getCurrentWeekCount,
  getFirstCompletionWeek,
  getGoalWeekRange,
  getLastNWeekStarts,
  getWeeklyCounts,
} from '../domain/goal-performance.calculator';
import * as ActivityGoalMap from '../mappers/activityGoalMap';
import { GoalProgressDTO, GoalStatsDTO } from '../dtos/getGoals.dto';
import { GetActivityGoalsByUserIdQuery } from '../queries/getActivityGoalsByUserId.query';
import { GetActivityGoalStatsQuery } from '../queries/getActivityGoalStats.query';

const PERFORMANCE_WEEK_COUNT = 8;
const HEATMAP_WEEK_COUNT = 26;

@Injectable()
export class ActivityGoalsService {
  constructor(
    private readonly getActivityGoalsByUserIdQuery: GetActivityGoalsByUserIdQuery,
    private readonly getActivityGoalStatsQuery: GetActivityGoalStatsQuery,
  ) {}

  async getAllByUserId(
    userId: string,
    today: string,
  ): Promise<GoalProgressDTO[]> {
    const weekRange = getGoalWeekRange(today);
    const { goals, events } = await this.getActivityGoalsByUserIdQuery.execute(
      userId,
      weekRange,
    );

    return goals.map((goal) => {
      const eventDates = events
        .filter((event) => event.activityId === goal.activityId)
        .map((event) => event.date);

      return {
        goalId: goal.id,
        activityId: goal.activityId,
        activityName: goal.activityName,
        targetPerWeek: goal.targetPerWeek,
        currentWeekCount: getCurrentWeekCount(eventDates, today),
        categoryColor: goal.categoryColor ?? null,
      };
    });
  }

  async getStats(
    activityId: string,
    userId: string,
    today: string,
  ): Promise<GoalStatsDTO> {
    const raw = await this.getActivityGoalStatsQuery.execute(
      activityId,
      userId,
    );
    if (!raw) {
      throw new NotFoundException('Goal not found');
    }

    const { goal, activityName, eventDates } = raw;
    const targetPerWeek = goal.targetPerWeek;

    const weekStarts = getLastNWeekStarts(PERFORMANCE_WEEK_COUNT, today);
    const weeklyPerformance = filterApplicableWeeks(
      getWeeklyCounts(eventDates, weekStarts, today),
      eventDates,
    );

    return {
      goal: ActivityGoalMap.toDTO(goal),
      activityName,
      currentWeekCount: getCurrentWeekCount(eventDates, today),
      weeklyPerformance,
      adherence: computeAdherence(weeklyPerformance, targetPerWeek),
      heatmap: computeHeatmapWeeks(eventDates, today, HEATMAP_WEEK_COUNT),
      firstCompletionDate: getFirstCompletionWeek(eventDates),
    };
  }
}
