import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../../shared/knex/database.module';
import ActivitiesRepo from './activities.repository';
import ActivityEventRepo from './activityEvent.repository';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { buildActivityEvent } from '../../../../test/factories/activity-event.factory';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';

describe('ActivitiesRepo (integration)', () => {
  let activitiesRepo: ActivitiesRepo;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ActivitiesRepo],
    }).compile();

    activitiesRepo = moduleRef.get(ActivitiesRepo);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('persists and retrieves an activity', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, {
      userId,
      name: 'Back Squat',
      interval: 3,
      ticker: 'SQUT',
    });

    const found = await activitiesRepo.getById(activity.id as string);
    expect(found?.name).toBe('Back Squat');
    expect(found?.ticker?.value).toBe('SQUT');
  });
});

describe('ActivityEventRepo (integration)', () => {
  let activityEventRepo: ActivityEventRepo;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ActivityEventRepo],
    }).compile();

    activityEventRepo = moduleRef.get(ActivityEventRepo);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('rejects duplicate events for the same activity and date', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const activity = await insertActivity(knexService, { userId });
    const activityId = activity.id as string;

    const event = buildActivityEvent({
      activityId,
      date: '2026-03-01',
    });
    await activityEventRepo.create(event);

    await expect(activityEventRepo.create(event)).rejects.toThrow(
      DuplicateActivityEventError,
    );
  });
});
