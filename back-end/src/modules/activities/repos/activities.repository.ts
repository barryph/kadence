import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import Activity from '../domain/activity.entity';
import * as ActivityMap from '../mappers/activityMap';
import { IActivityPersistence } from '../mappers/activityMap';

interface IActivitiesRepo {
  create(activity: Activity): Promise<Activity>;
  getById(id: string): Promise<Activity | null>;
  update(activity: Activity): Promise<Activity>;
  delete(id: string): Promise<boolean>;
}

// TODO: update all queries to return full object of category

@Injectable()
export default class ActivitiesRepo implements IActivitiesRepo {
  constructor(private readonly knexService: KnexService) {}

  async create(activityDomain: Activity): Promise<Activity> {
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
          GREATEST(
            EXTRACT(DAY FROM activities.interval) - (CURRENT_DATE - (SELECT MAX(date) FROM activity_events WHERE activity_id = activities.id)),
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

  async update(activityDomain: Activity): Promise<Activity> {
    const activity = ActivityMap.toPersistence(activityDomain);
    const result = await this.knexService.connection.raw<{
      rows: IActivityPersistence[];
    }>(
      `
        UPDATE activities
        SET name = :name, ticker = :ticker, interval = :interval, category_id = :category_id
        WHERE id = :id
        RETURNING *, EXTRACT(DAY FROM interval) || ' DAYS' AS interval, 0 AS days_until
      `,
      {
        id: activity.id,
        name: activity.name,
        ticker: activity.ticker || null,
        interval: activity.interval,
        category_id: activity.category_id || null,
      },
    );
    const updatedActivity = result.rows[0];
    return ActivityMap.persistenceToDomain(updatedActivity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.knexService.connection.raw<{ rowCount: number }>(
      `
        DELETE FROM activities
        WHERE id = :id
      `,
      { id },
    );

    return result.rowCount > 0;
  }
}
