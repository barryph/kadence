import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

import * as ActivityMap from '../mappers/activityMap';

@Injectable()
export class GetActivityTimelineQuery {
  constructor(private readonly knexService: KnexService) { }

  async execute(month: string): Promise<TimelineDTO[]> {
    const result = await this.knexService.connection.raw<{
      rows: any[];
    }>(
      `
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
