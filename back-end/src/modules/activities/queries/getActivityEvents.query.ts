import { BadRequestException, Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import {
  ActivityEventDTO,
  ActivityEventsDTO,
} from '../dtos/getActivityEvents.dto';

@Injectable()
export class GetActivityEventsQuery {
  constructor(private readonly knexService: KnexService) {}

  async execute(
    userId: string,
    from: string,
    to: string,
  ): Promise<ActivityEventsDTO> {
    if (from > to) {
      throw new BadRequestException(
        'Invalid date range: from must be on or before to',
      );
    }

    const rows = (await this.knexService
      .connection('activity_events')
      .innerJoin('activities', 'activities.id', 'activity_events.activity_id')
      .where('activities.user_id', userId)
      .whereBetween('activity_events.date', [from, to])
      .select([
        'activities.id as activity_id',
        'activities.category_id as category_id',
        'activity_events.date as date',
      ])
      .orderBy('activity_events.date', 'asc')) as Array<{
      activity_id: string;
      category_id: number | null;
      date: Date | string;
    }>;

    const events: ActivityEventDTO[] = rows.map((row) => ({
      activityId: row.activity_id,
      categoryId: row.category_id,
      date:
        typeof row.date === 'string'
          ? row.date.slice(0, 10)
          : row.date.toISOString().slice(0, 10),
    }));

    return { events };
  }
}
