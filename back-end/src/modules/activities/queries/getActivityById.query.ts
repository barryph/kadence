import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import * as ActivityMap from '../mappers/activityMap';
import { ActivityDTO } from '../mappers/activityMap';

@Injectable()
export class GetActivityByIdQuery {
  constructor(private readonly knexService: KnexService) { }

  async execute(activityId: string, userId: string): Promise<ActivityDTO> {
    const result = await this.knexService.connection.raw<{
      rows: any[];
    }>(
      `
        SELECT
          activities.*,
          EXTRACT(DAY FROM activities.interval) AS interval_days,
          GREATEST(
            EXTRACT(DAY FROM activities.interval) - (CURRENT_DATE - (SELECT MAX(date) FROM activity_events WHERE activity_id = activities.id)),
            0
          ) AS days_until
        FROM activities
        WHERE activities.id = :activityId
      `,
      {
        activityId,
      },
    );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Activity not found');
    }
    if (row.user_id !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      ticker: row.ticker,
      interval: parseInt(row.interval_days, 10),
      categoryId: row.category_id,
      daysUntil: Number(row.days_until),
    };
  }
}
