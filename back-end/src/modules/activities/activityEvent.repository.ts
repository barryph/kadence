import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';

interface IActivityEventRepo { }

@Injectable()
export default class ActivityEventRepo implements IActivityEventRepo {
  constructor(private readonly knexService: KnexService) { }
}
