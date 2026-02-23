import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import ActivitiesRepo from './activities.repository';
import { KnexService } from 'src/shared/knex/knex.service';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesRepo, KnexService],
})
export class ActivitiesModule { }
