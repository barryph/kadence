import Category from '../../src/modules/categories/domain/category.entity';
import CategoriesRepo from '../../src/modules/categories/repos/categories.repository';
import { KnexService } from '../../src/shared/knex/knex.service';

export interface CategoryFactoryOverrides {
  userId: string;
  name?: string;
  color?: string;
}

export function buildCategory(overrides: CategoryFactoryOverrides): Category {
  return Category.createNew({
    userId: overrides.userId,
    name: overrides.name ?? 'Health',
    color: overrides.color ?? '#ff0000',
  });
}

export async function insertCategory(
  knexService: KnexService,
  overrides: CategoryFactoryOverrides,
): Promise<Category> {
  const repo = new CategoriesRepo(knexService);
  return repo.create(buildCategory(overrides));
}
