import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../../../shared/knex/database.module';
import CategoriesRepo from './categories.repository';
import { KnexService } from '../../../shared/knex/knex.service';
import { insertUserWithKnex } from '../../../../test/factories/user.factory';
import {
  buildCategory,
  insertCategory,
} from '../../../../test/factories/category.factory';
import { insertActivity } from '../../../../test/factories/activity.factory';
import { getTestKnex } from '../../../../test/helpers/test-database';

describe('CategoriesRepo (integration)', () => {
  let repo: CategoriesRepo;
  let knexService: KnexService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [CategoriesRepo],
    }).compile();

    repo = moduleRef.get(CategoriesRepo);
    knexService = moduleRef.get(KnexService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates and retrieves categories by user', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const category = await repo.create(
      buildCategory({ userId, name: 'Health' }),
    );

    const categories = await repo.getAllByUserId(userId);
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Health');
    expect(category.id).toBeDefined();
  });

  it('nulls activity category_id when category is deleted', async () => {
    const user = await insertUserWithKnex(knexService);
    const userId = user.id as string;
    const category = await insertCategory(knexService, { userId });
    const categoryId = category.id as string;
    const activity = await insertActivity(knexService, {
      userId,
      categoryId: Number(categoryId),
    });
    const activityId = activity.id as string;

    await repo.delete(categoryId);

    const db = getTestKnex();
    const row = await db('activities').where({ id: activityId }).first();
    expect(row.category_id).toBeNull();
  });
});
