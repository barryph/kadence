import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../../shared/knex/database.module';
import ActivityGoalsRepo from './activityGoals.repository';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { insertActivityGoal } from '../../../../test/factories/activity-goal.factory';
import ActivityGoal from '../domain/activityGoal.entity';

describe('ActivityGoalsRepo (integration)', () => {
  let repo: ActivityGoalsRepo;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ActivityGoalsRepo],
    }).compile();

    repo = moduleRef.get(ActivityGoalsRepo);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates and retrieves a goal by activity', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;

    const created = await repo.create(
      ActivityGoal.createNew({ activityId, targetPerWeek: 4 }),
    );

    expect(created.id).toBeDefined();
    const found = await repo.getByActivityId(activityId);
    expect(found?.targetPerWeek).toBe(4);
  });

  it('enforces one goal per activity', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;

    await insertActivityGoal(knexService, { activityId, targetPerWeek: 3 });

    await expect(
      repo.create(ActivityGoal.createNew({ activityId, targetPerWeek: 5 })),
    ).rejects.toThrow();
  });

  it('updates the target of a goal', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;
    const created = await insertActivityGoal(knexService, {
      activityId,
      targetPerWeek: 2,
    });

    created.changeTargetPerWeek(6);
    const updated = await repo.update(created);

    expect(updated.targetPerWeek).toBe(6);
    const found = await repo.getByActivityId(activityId);
    expect(found?.targetPerWeek).toBe(6);
  });

  it('deletes a goal by activity', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;
    await insertActivityGoal(knexService, { activityId });

    await repo.deleteByActivityId(activityId);

    expect(await repo.getByActivityId(activityId)).toBeNull();
  });

  it('cascades goal deletion when the activity is deleted', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;
    await insertActivityGoal(knexService, { activityId });

    await knexService.connection.raw(
      `DELETE FROM activities WHERE id = :activityId`,
      { activityId },
    );

    expect(await repo.getByActivityId(activityId)).toBeNull();
  });
});
