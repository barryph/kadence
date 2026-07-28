import { Module } from '@nestjs/common';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './categories.controller';
import CategoriesRepo from './repos/categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepo],
  exports: [CategoriesService, CategoriesRepo],
})
export class CategoriesModule {}
