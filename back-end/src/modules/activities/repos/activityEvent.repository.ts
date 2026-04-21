import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import ActivityEvent from '../domain/activityEvent.entity';

interface IActivityEventRepo {
  create(activityEvent: ActivityEvent): Promise<ActivityEvent>;
}

@Injectable()
export default class ActivityEventRepo implements IActivityEventRepo {
  constructor(private readonly knexService: KnexService) { }

  async create(activityEventDomain: ActivityEvent): Promise<ActivityEvent> {
    const result = await this.knexService.connection.raw<{
      rows: any[];
    }>(
      `
        INSERT INTO activity_events (activity_id, date)
        VALUES (:activityId, :date)
        RETURNING *
      `,
      {
        activityId: activityEventDomain.activityId,
        date: activityEventDomain.date,
      },
    );
    const row = result.rows[0];
    return ActivityEvent.reconstitute({
      id: row.id.toString(),
      activityId: row.activity_id.toString(),
      date: row.date,
    });
  }
}
