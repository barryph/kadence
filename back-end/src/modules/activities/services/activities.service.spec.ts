import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import ActivitiesRepo from '../repos/activities.repository';
import ActivityEventRepo from '../repos/activityEvent.repository';
import CategoriesRepo from '../../categories/repos/categories.repository';
import { GetActivitiesByUserIdQuery } from '../queries/getActivitiesByUserId.query';
import { GetActivityByIdQuery } from '../queries/getActivityById.query';
import { GetActivityTimelineQuery } from '../queries/getActivityTimeline.query';
import { GetActivityEventsQuery } from '../queries/getActivityEvents.query';
import Activity from '../domain/activity.entity';
import Category from '../../categories/domain/category.entity';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';
import { KnexService } from 'src/shared/knex/knex.service';
import ActivityGoalsRepo from '../../activity-goals/repos/activityGoals.repository';
import ActivityGoal from '../../activity-goals/domain/activityGoal.entity';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activitiesRepo: jest.Mocked<ActivitiesRepo>;
  let activityEventRepo: jest.Mocked<ActivityEventRepo>;
  let categoriesRepo: jest.Mocked<CategoriesRepo>;
  let getActivityByIdQuery: jest.Mocked<GetActivityByIdQuery>;
  let activityGoalsRepo: jest.Mocked<ActivityGoalsRepo>;
  let knexService: jest.Mocked<KnexService>;

  const activityDto = {
    id: '1',
    userId: 'user-1',
    name: 'Exercise',
    interval: 7,
    daysUntil: 7,
  };

  beforeEach(async () => {
    activitiesRepo = {
      create: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ActivitiesRepo>;

    activityEventRepo = {
      create: jest.fn(),
      removeByActivityIdAndDate: jest.fn(),
      removeByActivityId: jest.fn(),
    } as unknown as jest.Mocked<ActivityEventRepo>;

    categoriesRepo = {
      getByIdAndUser: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepo>;

    getActivityByIdQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetActivityByIdQuery>;

    activityGoalsRepo = {
      create: jest.fn(),
      getByActivityId: jest.fn(),
      update: jest.fn(),
      deleteByActivityId: jest.fn(),
    } as unknown as jest.Mocked<ActivityGoalsRepo>;

    knexService = {
      getCurrentDate: jest.fn().mockResolvedValue('2026-01-15'),
      connection: {
        transaction: jest.fn((cb: (trx: unknown) => Promise<unknown>) =>
          cb('trx'),
        ),
      },
    } as unknown as jest.Mocked<KnexService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: ActivitiesRepo, useValue: activitiesRepo },
        { provide: ActivityEventRepo, useValue: activityEventRepo },
        { provide: CategoriesRepo, useValue: categoriesRepo },
        {
          provide: GetActivitiesByUserIdQuery,
          useValue: { execute: jest.fn() },
        },
        { provide: GetActivityByIdQuery, useValue: getActivityByIdQuery },
        {
          provide: GetActivityTimelineQuery,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetActivityEventsQuery,
          useValue: { execute: jest.fn() },
        },
        { provide: KnexService, useValue: knexService },
        { provide: ActivityGoalsRepo, useValue: activityGoalsRepo },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  it('rejects create when category does not belong to user', async () => {
    categoriesRepo.getByIdAndUser.mockResolvedValue(null);

    await expect(
      service.create(
        { name: 'Exercise', interval: 7, categoryId: 1 },
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates activity and optional lastDone event', async () => {
    categoriesRepo.getByIdAndUser.mockResolvedValue(
      Category.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Health',
        color: '#ff0000',
      }),
    );
    const created = Activity.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Exercise',
      interval: 7,
      categoryId: 1,
    });
    activitiesRepo.create.mockResolvedValue(created);
    getActivityByIdQuery.execute.mockResolvedValue(activityDto);

    const result = await service.create(
      {
        name: 'Exercise',
        interval: 7,
        categoryId: 1,
        lastDone: '2026-01-15',
      },
      'user-1',
    );

    expect(activityEventRepo.create).toHaveBeenCalled();
    expect(result.name).toBe('Exercise');
  });

  it('rejects complete when user does not own activity', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'other-user',
        name: 'Exercise',
        interval: 7,
      }),
    );

    await expect(
      service.completeActivity('1', 'user-1', '2026-01-15'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects duplicate complete on same date', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );
    activityEventRepo.create.mockRejectedValue(
      new DuplicateActivityEventError(),
    );

    await expect(
      service.completeActivity('1', 'user-1', '2026-01-15'),
    ).rejects.toThrow(ConflictException);
  });

  it('deletes events before deleting activity', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );

    await service.deleteActivity('1', 'user-1');

    expect(activityEventRepo.removeByActivityId).toHaveBeenCalledWith('1');
    expect(activitiesRepo.delete).toHaveBeenCalledWith('1');
  });

  it('creates an activity goal atomically with the activity', async () => {
    const created = Activity.reconstitute({
      id: '1',
      userId: 'user-1',
      name: 'Exercise',
      interval: 7,
    });
    activitiesRepo.create.mockResolvedValue(created);
    getActivityByIdQuery.execute.mockResolvedValue(activityDto);

    await service.create(
      { name: 'Exercise', interval: 7, goalTargetPerWeek: 3 },
      'user-1',
    );

    expect(activitiesRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
    expect(activityGoalsRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    );
    const goalArg = activityGoalsRepo.create.mock.calls[0][0];
    expect(goalArg.activityId).toBe('1');
    expect(goalArg.targetPerWeek).toBe(3);
  });

  it('updates an existing goal when editing an activity', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );
    activityGoalsRepo.getByActivityId.mockResolvedValue(
      ActivityGoal.reconstitute({
        id: 'g1',
        activityId: '1',
        targetPerWeek: 3,
      }),
    );
    getActivityByIdQuery.execute.mockResolvedValue(activityDto);

    await service.editActivity('1', { goalTargetPerWeek: 5 }, 'user-1');

    expect(activityGoalsRepo.update).toHaveBeenCalled();
    const updatedGoal = activityGoalsRepo.update.mock.calls[0][0];
    expect(updatedGoal.targetPerWeek).toBe(5);
  });

  it('creates a goal when editing an activity without one', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );
    activityGoalsRepo.getByActivityId.mockResolvedValue(null);
    getActivityByIdQuery.execute.mockResolvedValue(activityDto);

    await service.editActivity('1', { goalTargetPerWeek: 4 }, 'user-1');

    expect(activityGoalsRepo.create).toHaveBeenCalled();
  });

  it('removes the goal when goalTargetPerWeek is null', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );
    getActivityByIdQuery.execute.mockResolvedValue(activityDto);

    await service.editActivity('1', { goalTargetPerWeek: null }, 'user-1');

    expect(activityGoalsRepo.deleteByActivityId).toHaveBeenCalledWith(
      '1',
      expect.anything(),
    );
  });

  it('deletes the goal when deleting the activity', async () => {
    activitiesRepo.getById.mockResolvedValue(
      Activity.reconstitute({
        id: '1',
        userId: 'user-1',
        name: 'Exercise',
        interval: 7,
      }),
    );

    await service.deleteActivity('1', 'user-1');

    expect(activityGoalsRepo.deleteByActivityId).toHaveBeenCalledWith('1');
    expect(activityEventRepo.removeByActivityId).toHaveBeenCalledWith('1');
    expect(activitiesRepo.delete).toHaveBeenCalledWith('1');
  });
});
