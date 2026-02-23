import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';

export interface ActivityDTO {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
}

export interface IActivityPersistence {
  id?: string;
  user_id: string;
  name: string;
  ticker?: string;
  interval: string; // Postgres INTERVAL type e.g. '2 DAYS'
}

export function toDTO(activity: Activity): ActivityDTO {
  activity.ensurePersisted();
  return {
    id: activity.id,
    userId: activity.userId,
    name: activity.name,
    ticker: activity.ticker?.value,
    interval: activity.interval,
  };
}

export function toPersistence(activity: Activity): IActivityPersistence {
  return {
    user_id: activity.userId,
    name: activity.name,
    ticker: activity.ticker?.value,
    interval: `${activity.interval} DAYS`, // Inserting into the database default to seconds
  };
}

export function persistenceToDomain(activity: IActivityPersistence): Activity {
  let ticker: ActivityTicker | undefined;
  if (activity.ticker) {
    ticker = ActivityTicker.create(activity.ticker);
  }
  console.log('activity', activity.interval);
  return Activity.createNew({
    id: activity.id,
    userId: activity.user_id,
    name: activity.name,
    ticker,
    interval: parseInt(activity.interval.split(' ')[0], 10),
  });
}
