import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../../shared/knex/database.module';
import { GetActivityGoalStatsQuery } from './getActivityGoalStats.query';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { insertActivityGoal } from '../../../../test/factories/activity-goal.factory';
import { insertActivityEvent } from '../../../../test/factories/activity-event.factory';

describe('GetActivityGoalStatsQuery (integration)', () => {
  let query: GetActivityGoalStatsQuery;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [GetActivityGoalStatsQuery],
    }).compile();

    query = moduleRef.get(GetActivityGoalStatsQuery);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('returns the goal, activity name, and all event dates', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, {
      userId,
      name: 'Push-ups',
    });
    const activityId = activity.id as string;
    await insertActivityGoal(knexService, { activityId, targetPerWeek: 3 });

    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-07-06',
    });
    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-07-13',
    });

    const result = await query.execute(activityId, userId);

    expect(result).not.toBeNull();
    expect(result?.activityName).toBe('Push-ups');
    expect(result?.goal.targetPerWeek).toBe(3);
    expect(result?.eventDates).toEqual(['2026-07-06', '2026-07-13']);
  });

  it('returns null when the activity has no goal or belongs to another user', async () => {
    const owner = await insertUserWithKnex(knexService);
    const ownerId = owner.id as string;
    const other = await insertUserWithKnex(knexService, {
      email: 'other-stats@example.com',
    });
    const otherId = other.id as string;

    const activity = await insertActivity(knexService, { userId: ownerId });
    const activityId = activity.id as string;
    await insertActivityGoal(knexService, { activityId });

    await expect(query.execute(activityId, otherId)).resolves.toBeNull();
  });
});
