import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import ActivityEvent from '../domain/activityEvent.entity';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';

interface IActivityEventRepo {
  create(activityEvent: ActivityEvent): Promise<ActivityEvent>;
  removeByActivityIdAndDate(activityId: string, date: string): Promise<boolean>;
}

@Injectable()
export default class ActivityEventRepo implements IActivityEventRepo {
  constructor(private readonly knexService: KnexService) { }

  async create(activityEventDomain: ActivityEvent): Promise<ActivityEvent> {
    let result: { rows: any[] };
    try {
      result = await this.knexService.connection.raw<{
        rows: any[];
      }>(
        `
          INSERT INTO activity_events (activity_id, date)
          VALUES (:activityId, :date)
          RETURNING *, TO_CHAR(date, 'YYYY-MM-DD') as date
        `,
        {
          activityId: activityEventDomain.activityId,
          date: activityEventDomain.date,
        },
      );
    } catch (error: any) {
      if (error?.constraint === 'activity_events_activity_id_date_unique') {
        throw new DuplicateActivityEventError();
      }
      if (error?.name === 'unique_violation') {
        throw new DuplicateActivityEventError();
      }
      throw error;
    }

    const row = result.rows[0];
    return ActivityEvent.reconstitute({
      id: row.id.toString(),
      activityId: row.activity_id.toString(),
      date: row.date,
    });
  }

  async removeByActivityIdAndDate(
    activityId: string,
    date: string,
  ): Promise<boolean> {
    const result = await this.knexService.connection.raw<{ rowCount: number }>(
      `
        DELETE FROM activity_events
        WHERE activity_id = :activityId
          AND date = :date
      `,
      { activityId, date },
    );

    return result.rowCount > 0;
  }
}
