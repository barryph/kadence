import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import { ActivityTimelineDTO } from '../dtos/getTimelineDto.dto';

@Injectable()
export class GetActivityTimelineQuery {
  constructor(private readonly knexService: KnexService) { }

  async execute(userId: string, month: string): Promise<ActivityTimelineDTO> {
    // Lists all
    const result = await this.knexService.connection.raw<{
      rows: Array<{
        activity_id: string;
        dates: string[];
      }>;
    }>(
      `
      SELECT
        activities.id as activity_id,
      case when count(date) = 0
        then '[]'
        else json_agg(to_char(date, 'YYYY-MM-DD') ORDER BY date)
        end as dates
      FROM activities
      LEFT JOIN activity_events ON activities.id = activity_events.activity_id AND to_char(activity_events.date, 'YYYY-MM') = :month
      WHERE activities.user_id = :userId
      GROUP BY activities.id 
      `,
      {
        userId,
        month,
      },
    );
    const timeline = result.rows.reduce((acc, row) => {
      acc[row.activity_id] = row.dates;
      return acc;
    }, {});

    return timeline;
  }
}
