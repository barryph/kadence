import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import ActivityGoal from '../domain/activityGoal.entity';
import * as ActivityGoalMap from '../mappers/activityGoalMap';
import { IActivityGoalPersistence } from '../mappers/activityGoalMap';

export interface ActivityGoalStatsRaw {
  goal: ActivityGoal;
  activityName: string;
  eventDates: string[];
}

@Injectable()
export class GetActivityGoalStatsQuery {
  constructor(private readonly knexService: KnexService) {}

  async execute(
    activityId: string,
    userId: string,
  ): Promise<ActivityGoalStatsRaw | null> {
    const goalResult = await this.knexService.connection.raw<{
      rows: Array<IActivityGoalPersistence & { activity_name: string }>;
    }>(
      `
        SELECT
          ag.id,
          ag.activity_id,
          ag.target_per_week,
          activities.name AS activity_name
        FROM activity_goals ag
        JOIN activities ON activities.id = ag.activity_id
        WHERE ag.activity_id = :activityId
          AND activities.user_id = :userId
      `,
      { activityId, userId },
    );

    const row = goalResult.rows[0];
    if (!row) {
      return null;
    }

    const eventsResult = await this.knexService.connection.raw<{
      rows: Array<{ date: string }>;
    }>(
      `
        SELECT to_char(date, 'YYYY-MM-DD') AS date
        FROM activity_events
        WHERE activity_id = :activityId
        ORDER BY date ASC
      `,
      { activityId },
    );

    return {
      goal: ActivityGoalMap.persistenceToDomain(row),
      activityName: row.activity_name,
      eventDates: eventsResult.rows.map((event) => event.date),
    };
  }
}
