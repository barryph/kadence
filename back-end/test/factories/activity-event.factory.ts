import ActivityEvent from '../../src/modules/activities/domain/activityEvent.entity';
import ActivityEventRepo from '../../src/modules/activities/repos/activityEvent.repository';
import { KnexService } from '../../src/shared/knex/knex.service';

export interface ActivityEventFactoryOverrides {
  activityId: string;
  date?: string;
}

export function buildActivityEvent(
  overrides: ActivityEventFactoryOverrides,
): ActivityEvent {
  return ActivityEvent.createNew({
    activityId: overrides.activityId,
    date: overrides.date ?? '2026-01-15',
  });
}

export async function insertActivityEvent(
  knexService: KnexService,
  overrides: ActivityEventFactoryOverrides,
): Promise<ActivityEvent> {
  const repo = new ActivityEventRepo(knexService);
  return repo.create(buildActivityEvent(overrides));
}
