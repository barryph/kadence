import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import Activity from '../domain/activity.entity';
import * as ActivityMap from '../mappers/activityMap';
import { IActivityPersistence } from '../mappers/activityMap';

interface IActivitiesRepo {
  create(activity: Activity): Promise<Activity>;
  getById(id: string): Promise<Activity | null>;
}

@Injectable()
export default class ActivitiesRepo implements IActivitiesRepo {
  constructor(private readonly knexService: KnexService) {}

  async create(activityDomain: Activity) {
    const activity = ActivityMap.toPersistence(activityDomain);
    const result = await this.knexService.connection.raw<{
      rows: IActivityPersistence[];
    }>(
      `
        INSERT INTO activities (user_id, category_id, name, ticker, interval)
        VALUES (:userId, :categoryId, :name, :ticker, :interval)
        RETURNING *, EXTRACT(DAY FROM interval) || ' DAYS' AS interval, 0 AS days_until
      `,
      {
        userId: activity.user_id,
        categoryId: activity.category_id || null,
        name: activity.name,
        ticker: activity.ticker || null,
        interval: activity.interval,
      },
    );
    const newActivity = result.rows[0];
    return ActivityMap.persistenceToDomain(newActivity);
  }

  async getById(id: string): Promise<Activity | null> {
    const result = await this.knexService.connection.raw<{
      rows: IActivityPersistence[];
    }>(
      `
        SELECT
          activities.*,
          EXTRACT(DAY FROM activities.interval) || ' DAYS' AS interval,
          COALESCE(
            GREATEST(
              0,
              (CURRENT_DATE - (SELECT MAX(date) FROM activity_events WHERE activity_id = activities.id)) - EXTRACT(DAY FROM activities.interval)
            ),
            0
          ) AS days_until
        FROM activities
        WHERE id = :id
      `,
      { id },
    );
    if (result.rows.length === 0) {
      return null;
    }
    return ActivityMap.persistenceToDomain(result.rows[0]);
  }
}
