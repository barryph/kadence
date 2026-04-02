import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import Category from '../domain/category.entity';
import * as CategoryMap from '../mappers/categoryMap';
import { ICategoryPersistence } from '../mappers/categoryMap';

interface ICategoriesRepo {
  create(category: Category): Promise<Category>;
  getAllByUserId(userId: string): Promise<Category[]>;
}

@Injectable()
export default class CategoriesRepo implements ICategoriesRepo {
  constructor(private readonly knexService: KnexService) {}

  async create(categoryDomain: Category) {
    const category = CategoryMap.toPersistence(categoryDomain);
    const result = await this.knexService.connection.raw<{
      rows: ICategoryPersistence[];
    }>(
      `
        INSERT INTO categories (user_id, name, color)
        VALUES (:userId, :name, :color)
        RETURNING *
      `,
      {
        userId: category.user_id,
        name: category.name,
        color: category.color,
      },
    );
    const newCategory = result.rows[0];
    return CategoryMap.persistenceToDomain(newCategory);
  }

  async getAllByUserId(userId: string) {
    const result = await this.knexService.connection.raw<{
      rows: ICategoryPersistence[];
    }>(
      `
        SELECT *
        FROM categories
        WHERE user_id = :userId
      `,
      {
        userId,
      },
    );
    return result.rows.map((category) => CategoryMap.persistenceToDomain(category));
  }
}
