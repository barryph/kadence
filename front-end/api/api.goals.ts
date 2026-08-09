import { apiClient, type OptionalOptions } from './api.client';

export interface IGoal {
  id: string;
  activityId: string;
  targetPerWeek: number;
}

export interface IGoalProgress {
  goalId: string;
  activityId: string;
  activityName: string;
  targetPerWeek: number;
  currentWeekCount: number;
  categoryColor?: string | null;
}

export interface IGoalWeeklyPoint {
  weekStart: string;
  count: number;
}

export interface IGoalAdherence {
  applicable: number;
  met: number;
  /** Fraction 0..1, or null when there are no applicable weeks */
  percentage: number | null;
}

export interface IGoalStats {
  goal: IGoal;
  activityName: string;
  currentWeekCount: number;
  weeklyPerformance: IGoalWeeklyPoint[];
  adherence: IGoalAdherence;
  heatmap: IGoalWeeklyPoint[];
  firstCompletionDate: string | null;
}

interface GetAllGoalsResponse {
  goals: IGoalProgress[];
}

export const goalsAPI = {
  getAll(today: string, options?: OptionalOptions) {
    return apiClient.get<GetAllGoalsResponse>(
      `/goals?today=${encodeURIComponent(today)}`,
      options,
    );
  },

  getStats(
    activityId: number | string,
    today: string,
    options?: OptionalOptions,
  ) {
    return apiClient.get<IGoalStats>(
      `/goals/${activityId}?today=${encodeURIComponent(today)}`,
      options,
    );
  },
};
