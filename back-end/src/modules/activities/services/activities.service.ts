import { Injectable } from '@nestjs/common';
import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';
import CreateActivityDTO from '../dtos/createActivity.dto';
import ActivitiesRepo from '../repos/activities.repository';
import * as ActivityMap from '../mappers/activityMap';
import { GetActivitiesByUserIdQuery } from '../queries/getActivitiesByUserId.query';
import { ActivityWithCategoryDTO } from '../dtos/activityWithCategory.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activitiesRepo: ActivitiesRepo,
    private readonly getActivitiesByUserIdQuery: GetActivitiesByUserIdQuery,
  ) {}

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

    const created = await this.activitiesRepo.create(activity);
    return ActivityMap.toDTO(created);
  }

  async getAllByUserId(userId: string): Promise<ActivityWithCategoryDTO[]> {
    return this.getActivitiesByUserIdQuery.execute(userId);
  }
}
