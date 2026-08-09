import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../../shared/knex/database.module';
import { GetActivityGoalsByUserIdQuery } from './getActivityGoalsByUserId.query';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { insertActivityGoal } from '../../../../test/factories/activity-goal.factory';
import { insertActivityEvent } from '../../../../test/factories/activity-event.factory';

describe('GetActivityGoalsByUserIdQuery (integration)', () => {
  let query: GetActivityGoalsByUserIdQuery;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [GetActivityGoalsByUserIdQuery],
    }).compile();

    query = moduleRef.get(GetActivityGoalsByUserIdQuery);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('returns only the user own goals with activity names', async () => {
    const owner = await insertUserWithKnex(knexService);
    const ownerId = owner.id as string;
    const other = await insertUserWithKnex(knexService, {
      email: 'other-goals@example.com',
    });
    const otherId = other.id as string;

    const ownedActivity = await insertActivity(knexService, {
      userId: ownerId,
      name: 'Squats',
    });
    await insertActivityGoal(knexService, {
      activityId: ownedActivity.id as string,
      targetPerWeek: 3,
    });

    const otherActivity = await insertActivity(knexService, {
      userId: otherId,
      name: 'Running',
    });
    await insertActivityGoal(knexService, {
      activityId: otherActivity.id as string,
      targetPerWeek: 5,
    });

    const result = await query.execute(ownerId, {
      from: '2026-08-03',
      to: '2026-08-09',
    });

    expect(result.goals).toHaveLength(1);
    expect(result.goals[0]).toMatchObject({
      activityName: 'Squats',
      targetPerWeek: 3,
    });
  });

  it('returns only events within the provided week range', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;
    await insertActivityGoal(knexService, { activityId, targetPerWeek: 3 });

    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-08-04',
    });
    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-08-20',
    });

    const result = await query.execute(userId, {
      from: '2026-08-03',
      to: '2026-08-09',
    });

    expect(result.events).toEqual([{ activityId, date: '2026-08-04' }]);
  });
});
