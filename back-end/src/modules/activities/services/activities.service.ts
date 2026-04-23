import { Injectable } from '@nestjs/common';
import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';
import CreateActivityDTO from '../dtos/createActivity.dto';
import ActivitiesRepo from '../repos/activities.repository';
import ActivityEventRepo from '../repos/activityEvent.repository';
import * as ActivityMap from '../mappers/activityMap';
import ActivityEvent from '../domain/activityEvent.entity';
import { ActivityDTO } from '../mappers/activityMap';
import { GetActivitiesByUserIdQuery } from '../queries/getActivitiesByUserId.query';
import { GetActivityTimelineQuery } from '../queries/getActivityTimeline.query';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';
import { ActivityTimelineDTO } from '../dtos/timeline.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepo,
    private readonly activityEventRepo: ActivityEventRepo,
    private readonly getActivitiesByUserIdQuery: GetActivitiesByUserIdQuery,
    private readonly getActivityTimelineQuery: GetActivityTimelineQuery,
  ) { }

  async create(
    createActivityDto: CreateActivityDTO,
    userId: string,
  ): Promise<CreateActivityDTO> {
    let ticker: ActivityTicker | undefined;
    if (createActivityDto.ticker) {
      ticker = ActivityTicker.create(createActivityDto.ticker);
    }
    const activity = Activity.createNew({
      userId,
      name: createActivityDto.name,
      ticker,
      interval: createActivityDto.interval,
    });

    const createdActivity: Activity =
      await this.activitiesRepo.create(activity);

    if (!createActivityDto.lastDone) {
      return ActivityMap.toDTO(createdActivity);
    }

    createdActivity.ensurePersisted();
    const event = ActivityEvent.createNew({
      activityId: createdActivity.id,
      date: new Date(createActivityDto.lastDone),
    });
    await this.activityEventRepo.create(event);
    const updatedActivity = await this.activitiesRepo.getById(
      createdActivity.id,
    );

    if (!updatedActivity) {
      throw new Error(
        'Something has gone wrong. The created activity does not exist.',
      );
    }

    return ActivityMap.toDTO(updatedActivity);
  }

  async getAllByUserId(userId: string): Promise<ActivityWithCategoryDTO[]> {
    return this.getActivitiesByUserIdQuery.execute(userId);
  }

  async completeActivity(
    activityId: string,
    userId: string,
  ): Promise<ActivityDTO> {
    const activity = await this.activitiesRepo.getById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const event = ActivityEvent.createNew({
      activityId,
      date: new Date(),
    });
    await this.activityEventRepo.create(event);

    const updatedActivity = await this.activitiesRepo.getById(activityId);
    return ActivityMap.toDTO(updatedActivity!);
  }

  async getActivityTimeline(month: string): Promise<ActivityTimelineDTO> {
    return this.getActivityTimelineQuery.execute(month);
  }
}
