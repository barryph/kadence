import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

import * as ActivityMap from '../mappers/activityMap';

@Injectable()
export class GetActivitiesByUserIdQuery {
  constructor(private readonly knexService: KnexService) {}

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
          categories.user_id AS category_user_id
        FROM activities
        LEFT JOIN categories ON activities.category_id = categories.id
        WHERE activities.user_id = :userId
      `,
      {
        userId,
      },
    );

    return result.rows.map((row) => ActivityMap.rawToActivityWithCategoryDTO(row));
  }
}
