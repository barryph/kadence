import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './services/categories.service';
import CategoriesRepo from './repos/categories.repository';
import { KnexService } from 'src/shared/knex/knex.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepo, KnexService],
  exports: [CategoriesService, CategoriesRepo],
})
export class CategoriesModule {}
