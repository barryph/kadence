import { Injectable } from '@nestjs/common';
import knex from 'knex';
import * as config from '../../../knexfile';

const environment = process.env.NODE_ENV || 'development';

@Injectable()
export class KnexService {
  private db: knex.Knex;

  constructor() {
    this.db = knex(config[environment]);
  }

  get connection() {
    return this.db;
  }
}
