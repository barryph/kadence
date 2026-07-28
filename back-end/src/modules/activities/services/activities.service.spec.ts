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
import Activity from '../domain/activity.entity';
import Category from '../../categories/domain/category.entity';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activitiesRepo: jest.Mocked<ActivitiesRepo>;
  let activityEventRepo: jest.Mocked<ActivityEventRepo>;
  let categoriesRepo: jest.Mocked<CategoriesRepo>;
  let getActivityByIdQuery: jest.Mocked<GetActivityByIdQuery>;

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
});
