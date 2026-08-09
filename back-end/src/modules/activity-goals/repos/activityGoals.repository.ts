import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import ActivityGoal from '../domain/activityGoal.entity';
import * as ActivityGoalMap from '../mappers/activityGoalMap';
import { IActivityGoalPersistence } from '../mappers/activityGoalMap';
import type { Knex } from 'knex';

interface IActivityGoalsRepo {
  create(goal: ActivityGoal, trx?: Knex.Transaction): Promise<ActivityGoal>;
  getByActivityId(activityId: string): Promise<ActivityGoal | null>;
  update(goal: ActivityGoal, trx?: Knex.Transaction): Promise<ActivityGoal>;
  deleteByActivityId(activityId: string, trx?: Knex.Transaction): Promise<void>;
}

@Injectable()
export default class ActivityGoalsRepo implements IActivityGoalsRepo {
  constructor(private readonly knexService: KnexService) {}

  async create(
    goalDomain: ActivityGoal,
    trx?: Knex.Transaction,
  ): Promise<ActivityGoal> {
    const goal = ActivityGoalMap.toPersistence(goalDomain);
    const connection = trx ?? this.knexService.connection;
    const result = await connection.raw<{ rows: IActivityGoalPersistence[] }>(
      `
        INSERT INTO activity_goals (activity_id, target_per_week)
        VALUES (:activityId, :targetPerWeek)
        RETURNING id, activity_id, target_per_week
      `,
      {
        activityId: goal.activity_id,
        targetPerWeek: goal.target_per_week,
      },
    );
    const newGoal = result.rows[0];
    return ActivityGoalMap.persistenceToDomain(newGoal);
  }

  async getByActivityId(activityId: string): Promise<ActivityGoal | null> {
    const result = await this.knexService.connection.raw<{
      rows: IActivityGoalPersistence[];
    }>(
      `
        SELECT id, activity_id, target_per_week
        FROM activity_goals
        WHERE activity_id = :activityId
      `,
      { activityId },
    );
    if (result.rows.length === 0) {
      return null;
    }
    return ActivityGoalMap.persistenceToDomain(result.rows[0]);
  }

  async update(
    goalDomain: ActivityGoal,
    trx?: Knex.Transaction,
  ): Promise<ActivityGoal> {
    goalDomain.ensurePersisted();
    const goal = ActivityGoalMap.toPersistence(goalDomain);
    const connection = trx ?? this.knexService.connection;
    const result = await connection.raw<{ rows: IActivityGoalPersistence[] }>(
      `
        UPDATE activity_goals
        SET target_per_week = :targetPerWeek
        WHERE id = :id
        RETURNING id, activity_id, target_per_week
      `,
      {
        id: goal.id,
        targetPerWeek: goal.target_per_week,
      },
    );
    const updatedGoal = result.rows[0];
    return ActivityGoalMap.persistenceToDomain(updatedGoal);
  }

  async deleteByActivityId(
    activityId: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const connection = trx ?? this.knexService.connection;
    await connection.raw(
      `
        DELETE FROM activity_goals
        WHERE activity_id = :activityId
      `,
      { activityId },
    );
  }
}
