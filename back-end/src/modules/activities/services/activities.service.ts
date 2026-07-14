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
import CategoriesRepo from '../../categories/repos/categories.repository';
import { DuplicateActivityEventError } from '../activitiyEvent.errors';
import ActivityEvent from '../domain/activityEvent.entity';
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
    private readonly categoriesRepo: CategoriesRepo,
    private readonly getActivitiesByUserIdQuery: GetActivitiesByUserIdQuery,
    private readonly getActivityByIdQuery: GetActivityByIdQuery,
    private readonly getActivityTimelineQuery: GetActivityTimelineQuery,
  ) { }

  async create(
    createActivityDto: CreateActivityDTO,
    userId: string,
  ): Promise<ActivityWithCategoryDTO> {
    if (createActivityDto.categoryId !== undefined) {
      const category = await this.categoriesRepo.getByIdAndUser(
        createActivityDto.categoryId,
        userId,
      );
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    let ticker: ActivityTicker | undefined;
    if (createActivityDto.ticker) {
      ticker = ActivityTicker.create(createActivityDto.ticker);
    }
    const activity = Activity.createNew({
      userId,
      name: createActivityDto.name,
      ticker,
      interval: createActivityDto.interval,
      categoryId: createActivityDto.categoryId,
    });

    const createdActivity: Activity =
      await this.activitiesRepo.create(activity);

    if (createActivityDto.lastDone) {
      // Record optional "lastDone" to event db
      createdActivity.ensurePersisted();
      const event = ActivityEvent.createNew({
        activityId: createdActivity.id,
        date: createActivityDto.lastDone,
      });
      await this.activityEventRepo.create(event);
      await this.activitiesRepo.getById(createdActivity.id);
    }

    if (!createdActivity.isPersisted()) {
      throw new Error(
        'Something has gone wrong. The created activity does not exist.',
      );
    }

    return this.getActivityByIdQuery.execute(createdActivity.id, userId);
  }

  async getAllByUserId(userId: string): Promise<ActivityWithCategoryDTO[]> {
    return this.getActivitiesByUserIdQuery.execute(userId);
  }

  async getById(
    activityId: string,
    userId: string,
  ): Promise<ActivityWithCategoryDTO> {
    return this.getActivityByIdQuery.execute(activityId, userId);
  }

  async editActivity(
    activityId: string,
    editActivityDto: EditActivityDTO,
    userId: string,
  ): Promise<ActivityWithCategoryDTO> {
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
    // Allow null value to clear the category
    if (editActivityDto.categoryId !== undefined) {
      activity.changeCategoryId(editActivityDto.categoryId);
    }

    await this.activitiesRepo.update(activity);
    return this.getActivityByIdQuery.execute(activityId, userId);
  }

  async completeActivity(
    activityId: string,
    userId: string,
    date: string,
  ): Promise<void> {
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
  }

  async undoActivityEvent(
    activityId: string,
    userId: string,
    date: string,
  ): Promise<void> {
    const activity = await this.activitiesRepo.getById(activityId);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.activityEventRepo.removeByActivityIdAndDate(activityId, date);
  }

  async getActivityTimeline(
    userId: string,
    month: string,
  ): Promise<ActivityTimelineDTO> {
    return this.getActivityTimelineQuery.execute(userId, month);
  }

  async deleteActivity(activityId: string, userId: string): Promise<void> {
    const activity = await this.activitiesRepo.getById(activityId);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    if (activity.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.activityEventRepo.removeByActivityId(activityId);
    await this.activitiesRepo.delete(activityId);
  }
}
