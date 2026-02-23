import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import Activity from './domain/activity.entity';
import * as ActivityMap from './mappers/activityMap';
import { IActivityPersistence } from './mappers/activityMap';

interface IActivitiesRepo {
  create(activity: Activity): Promise<Activity>;
  getAllByUserId(userId: string): Promise<Activity[]>;
}

@Injectable()
export default class ActivitiesRepo implements IActivitiesRepo {
  constructor(private readonly knexService: KnexService) { }

  async create(activityDomain: Activity) {
    const activity = ActivityMap.toPersistence(activityDomain);
    const result = await this.knexService.connection.raw<{
      rows: IActivityPersistence[];
    }>(
      `
        INSERT INTO activities (user_id, name, ticker, interval)
        VALUES (:userId, :name, :ticker, :interval)
        RETURNING *, EXTRACT(DAY FROM interval) || ' DAYS' AS interval
      `,
      {
        userId: activity.user_id,
        name: activity.name,
        ticker: activity.ticker,
        interval: activity.interval,
      },
    );
    const newActivity = result.rows[0];
    return ActivityMap.persistenceToDomain(newActivity);
  }

  async getAllByUserId(userId: string) {
    const result = await this.knexService.connection.raw<{
      rows: IActivityPersistence[];
    }>(
      `
        SELECT *, EXTRACT(DAY FROM interval) || ' DAYS' AS interval, latest_event
        FROM activities
        LEFT JOIN LATERAL (
          SELECT * FROM activity_events
          WHERE activity_events.activity_id = activities.id
          ORDER BY date DESC
          LIMIT 1
        ) as latest_event ON true
        WHERE user_id = :userId
      `,
      {
        userId,
      },
    );
    console.log('result:', result.rows);
    return result.rows.map((activity) =>
      ActivityMap.persistenceToDomain(activity),
    );
  }
}
