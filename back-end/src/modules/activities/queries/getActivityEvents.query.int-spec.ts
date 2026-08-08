import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DatabaseModule } from '../../../shared/knex/database.module';
import { GetActivityEventsQuery } from './getActivityEvents.query';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { insertActivityEvent } from '../../../../test/factories/activity-event.factory';
import { insertCategory } from '../../../../test/factories/category.factory';

describe('GetActivityEventsQuery (integration)', () => {
  let getActivityEventsQuery: GetActivityEventsQuery;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [GetActivityEventsQuery],
    }).compile();

    getActivityEventsQuery = moduleRef.get(GetActivityEventsQuery);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('rejects inverted date ranges', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;

    await expect(
      getActivityEventsQuery.execute(userId, '2026-03-10', '2026-03-01'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns events within the date range for the user only', async () => {
    const owner = await insertUserWithKnex(knexService);
    const ownerId = owner.id as string;
    const other = await insertUserWithKnex(knexService, {
      email: 'events-other@example.com',
    });
    const otherId = other.id as string;

    const category = await insertCategory(knexService, {
      userId: ownerId,
      name: 'Legs',
      color: '#ff0000',
    });

    const activity = await insertActivity(knexService, {
      userId: ownerId,
      categoryId: category.id,
    });
    const activityId = activity.id as string;

    const otherActivity = await insertActivity(knexService, {
      userId: otherId,
    });
    const otherActivityId = otherActivity.id as string;

    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-03-03',
    });
    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-03-10',
    });
    await insertActivityEvent(knexService, {
      activityId,
      date: '2026-02-28',
    });
    await insertActivityEvent(knexService, {
      activityId: otherActivityId,
      date: '2026-03-05',
    });

    const result = await getActivityEventsQuery.execute(
      ownerId,
      '2026-03-01',
      '2026-03-31',
    );

    expect(result.events).toEqual([
      {
        activityId,
        categoryId: category.id,
        date: '2026-03-03',
      },
      {
        activityId,
        categoryId: category.id,
        date: '2026-03-10',
      },
    ]);
  });
});
