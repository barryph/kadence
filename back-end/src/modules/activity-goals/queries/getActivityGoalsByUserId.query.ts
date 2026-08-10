import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import type { GoalWeekRange } from '../domain/goal-performance.calculator';

export interface ActivityGoalWithActivity {
  id: string;
  activityId: string;
  targetPerWeek: number;
  activityName: string;
  categoryColor?: string | null;
}

export interface ActivityGoalsQueryResult {
  goals: ActivityGoalWithActivity[];
  events: { activityId: string; date: string }[];
}

@Injectable()
export class GetActivityGoalsByUserIdQuery {
  constructor(private readonly knexService: KnexService) {}

  async execute(
    userId: string,
    weekRange: GoalWeekRange,
  ): Promise<ActivityGoalsQueryResult> {
    const goalsResult = await this.knexService.connection.raw<{
      rows: Array<{
        id: string;
        activity_id: string;
        target_per_week: number;
        activity_name: string;
        category_color: string | null;
      }>;
    }>(
      `
        SELECT
          ag.id,
          ag.activity_id,
          ag.target_per_week,
          activities.name AS activity_name,
          categories.color AS category_color
        FROM activity_goals ag
        JOIN activities ON activities.id = ag.activity_id
        LEFT JOIN categories ON categories.id = activities.category_id
        WHERE activities.user_id = :userId
        ORDER BY activities.name ASC
      `,
      { userId },
    );

    const eventsResult = await this.knexService.connection.raw<{
      rows: Array<{
        activity_id: string;
        date: string;
      }>;
    }>(
      `
        SELECT
          activities.id AS activity_id,
          to_char(activity_events.date, 'YYYY-MM-DD') AS date
        FROM activity_events
        JOIN activities ON activities.id = activity_events.activity_id
        WHERE activities.user_id = :userId
          AND activity_events.date BETWEEN :from AND :to
      `,
      { userId, from: weekRange.from, to: weekRange.to },
    );

    return {
      goals: goalsResult.rows.map((row) => ({
        id: row.id,
        activityId: row.activity_id,
        targetPerWeek: row.target_per_week,
        activityName: row.activity_name,
        categoryColor: row.category_color,
      })),
      events: eventsResult.rows.map((row) => ({
        activityId: row.activity_id,
        date: row.date,
      })),
    };
  }
}
