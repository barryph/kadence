import { CategoryDTO } from '../../categories/mappers/categoryMap';

export interface ActivityGoalDTO {
  id: string;
  activityId: string;
  targetPerWeek: number;
}

export interface ActivityGoalProgressDTO {
  currentWeekCount: number;
}

export interface ActivityWithCategoryDTO {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  categoryId?: number;
  category?: CategoryDTO;
  daysUntil: number;
  goal?: ActivityGoalDTO;
  goalProgress?: ActivityGoalProgressDTO;
}
