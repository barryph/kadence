import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

export interface ActivityDTO {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  categoryId?: number;
  daysUntil?: number;
}

export interface IActivityPersistence {
  id?: string;
  user_id: string;
  category_id?: number;
  name: string;
  ticker?: string;
  interval: string; // Postgres INTERVAL type e.g. '2 DAYS'
  days_until?: number;
}

export function toDTO(activity: Activity): ActivityDTO {
  activity.ensurePersisted();
  return {
    id: activity.id,
    userId: activity.userId,
    categoryId: activity.categoryId,
    name: activity.name,
    ticker: activity.ticker?.value,
    interval: activity.interval,
    daysUntil: activity.daysUntil,
  };
}

export function toPersistence(activity: Activity): IActivityPersistence {
  return {
    ...(activity.isPersisted() && { id: activity.id }),
    user_id: activity.userId,
    category_id: activity.categoryId,
    name: activity.name,
    ticker: activity.ticker?.value,
    interval: `${activity.interval} DAYS`,
    days_until: activity.daysUntil,
  };
}

export function persistenceToDomain(activity: IActivityPersistence): Activity {
  let ticker: ActivityTicker | undefined;
  if (activity.ticker) {
    ticker = ActivityTicker.create(activity.ticker);
  }

  return Activity.createNew({
    id: activity.id,
    userId: activity.user_id,
    categoryId: activity.category_id,
    name: activity.name,
    ticker,
    interval: parseInt(activity.interval.split(' ')[0], 10),
    daysUntil: Number(activity.days_until ?? 0),
  });
}

export function rawToActivityWithCategoryDTO(
  row: any,
): ActivityWithCategoryDTO {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    ticker: row.ticker,
    interval: parseInt(row.interval_days, 10),
    categoryId: row.category_id,
    daysUntil: Number(row.days_until),
    ...(row.category && {
      category: {
        id: row.category.id,
        userId: row.category.user_id,
        name: row.category.name,
        color: row.category.color,
      },
    }),
  } as ActivityWithCategoryDTO;
}
