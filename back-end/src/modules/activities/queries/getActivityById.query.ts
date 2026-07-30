import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import * as ActivityMap from '../mappers/activityMap';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

@Injectable()
export class GetActivityByIdQuery {
  constructor(private readonly knexService: KnexService) {}

  async execute(
    activityId: string,
    userId: string,
  ): Promise<ActivityWithCategoryDTO> {
    const result = await this.knexService.connection.raw<{
      rows: any[];
    }>(
      `
        SELECT
          activities.*,
          EXTRACT(DAY FROM activities.interval) AS interval_days,
          row_to_json(categories) as category,
          GREATEST(
            EXTRACT(DAY FROM activities.interval) - (CURRENT_DATE - (SELECT MAX(date) FROM activity_events WHERE activity_id = activities.id)),
            0
          ) AS days_until
        FROM activities
        LEFT JOIN categories ON activities.category_id = categories.id
        WHERE activities.id = :activityId
      `,
      {
        activityId,
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Activity not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.user_id !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return ActivityMap.rawToActivityWithCategoryDTO(row);
  }
}
