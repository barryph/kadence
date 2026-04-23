import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

import * as ActivityMap from '../mappers/activityMap';
import { ActivityTimelineDTO } from '../dtos/getTimelineDto.dto';

@Injectable()
export class GetActivityTimelineQuery {
  constructor(private readonly knexService: KnexService) { }

  async execute(userId: string, month: string): Promise<ActivityTimelineDTO[]> {
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
