import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import * as ActivityMap from '../mappers/activityMap';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

@Injectable()
export class GetActivitiesByUserIdQuery {
  constructor(private readonly knexService: KnexService) { }

  async execute(userId: string): Promise<ActivityWithCategoryDTO[]> {
    const result = await this.knexService.connection.raw<{
      rows: any[];
    }>(
      `
        SELECT
          activities.*,
          EXTRACT(DAY FROM activities.interval) AS interval_days,
          categories.name AS category_name,
          categories.color AS category_color,
          categories.user_id AS category_user_id,
          GREATEST(
            EXTRACT(DAY FROM activities.interval) - (CURRENT_DATE - (SELECT MAX(date) FROM activity_events WHERE activity_id = activities.id)),
            0
          ) AS days_until
        FROM activities
        LEFT JOIN categories ON activities.category_id = categories.id
        WHERE activities.user_id = :userId
      `,
      {
        userId,
      },
    );

    return result.rows.map((row) =>
      ActivityMap.rawToActivityWithCategoryDTO(row),
    );
  }
}
