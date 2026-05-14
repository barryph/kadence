import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';
import CreateActivityDTO from '../dtos/createActivity.dto';
import ActivitiesRepo from '../repos/activities.repository';
import ActivityEventRepo from '../repos/activityEvent.repository';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';
import * as ActivityMap from '../mappers/activityMap';
import ActivityEvent from '../domain/activityEvent.entity';
import { ActivityDTO } from '../mappers/activityMap';
import { GetActivitiesByUserIdQuery } from '../queries/getActivitiesByUserId.query';
import { GetActivityByIdQuery } from '../queries/getActivityById.query';
import { GetActivityTimelineQuery } from '../queries/getActivityTimeline.query';
import EditActivityDTO from '../dtos/editActivity.dto';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';
import { ActivityTimelineDTO } from '../dtos/getTimelineDto.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepo,
    private readonly activityEventRepo: ActivityEventRepo,
    private readonly getActivitiesByUserIdQuery: GetActivitiesByUserIdQuery,
    private readonly getActivityByIdQuery: GetActivityByIdQuery,
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
      date: createActivityDto.lastDone,
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

  async getById(activityId: string, userId: string): Promise<ActivityDTO> {
    return this.getActivityByIdQuery.execute(activityId, userId);
  }

  async editActivity(
    activityId: string,
    editActivityDto: EditActivityDTO,
    userId: string,
  ): Promise<ActivityDTO> {
    const activity = await this.activitiesRepo.getById(activityId);
    // Authorize the request
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Update values
    let ticker: ActivityTicker | undefined;
    if (editActivityDto.ticker) {
      ticker = ActivityTicker.create(editActivityDto.ticker);
      activity.changeTicker(ticker);
    }
    if (editActivityDto.name) {
      activity.changeName(editActivityDto.name);
    }
    if (editActivityDto.interval) {
      activity.changeInterval(editActivityDto.interval);
    }

    const updatedActivity = await this.activitiesRepo.update(activity);
    return ActivityMap.toDTO(updatedActivity);
  }

  async completeActivity(
    activityId: string,
    userId: string,
    date: string,
  ): Promise<ActivityDTO> {
    const activity = await this.activitiesRepo.getById(activityId);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const event = ActivityEvent.createNew({
      activityId,
      date,
    });
    try {
      await this.activityEventRepo.create(event);
    } catch (error) {
      if (error instanceof DuplicateActivityEventError) {
        throw new ConflictException(
          'Activity already completed on the provided date',
        );
      }
      throw error;
    }

    const updatedActivity = await this.activitiesRepo.getById(activityId);
    return ActivityMap.toDTO(updatedActivity!);
  }

  async undoActivityEvent(
    activityId: string,
    userId: string,
    date: string,
  ): Promise<ActivityDTO> {
    const activity = await this.activitiesRepo.getById(activityId);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.activityEventRepo.removeByActivityIdAndDate(activityId, date);

    const updatedActivity = await this.activitiesRepo.getById(activityId);
    return ActivityMap.toDTO(updatedActivity!);
  }

  async getActivityTimeline(
    userId: string,
    month: string,
  ): Promise<ActivityTimelineDTO> {
    return this.getActivityTimelineQuery.execute(userId, month);
  }
}
