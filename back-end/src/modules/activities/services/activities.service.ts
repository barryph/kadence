import { Injectable } from '@nestjs/common';
import Activity from '../domain/activity.entity';
import ActivityTicker from '../domain/activityTicker.vo';
import CreateActivityDTO from '../dtos/createActivity.dto';
import ActivitiesRepo from '../repos/activities.repository';
import * as ActivityMap from '../mappers/activityMap';
import type { ActivityDTO } from '../mappers/activityMap';

@Injectable()
export class ActivitiesService {
  constructor(private readonly activitiesRepo: ActivitiesRepo) {}

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

  async getAllByUserId(userId: string): Promise<ActivityDTO[]> {
    const activities = await this.activitiesRepo.getAllByUserId(userId);
    return activities.map((activity) => ActivityMap.toDTO(activity));
  }
}
