import { Injectable, OnModuleDestroy } from '@nestjs/common';
import knex from 'knex';
import * as config from '../../../knexfile';

const environment = process.env.NODE_ENV || 'development';

const knexConfig =
  config[environment as keyof typeof config] ?? config.development;

@Injectable()
export class KnexService implements OnModuleDestroy {
  private db: knex.Knex;

  constructor() {
    this.db = knex(knexConfig);
  }

  get connection() {
    return this.db;
  }

  /** Returns the database server's current date as YYYY-MM-DD. */
  async getCurrentDate(): Promise<string> {
    const result = await this.db.raw<{ rows: Array<{ date: string }> }>(
      `SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS date`,
    );
    return result.rows[0].date;
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
