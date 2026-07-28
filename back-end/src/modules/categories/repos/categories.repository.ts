import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/shared/knex/knex.service';
import Category from '../domain/category.entity';
import * as CategoryMap from '../mappers/categoryMap';
import { ICategoryPersistence } from '../mappers/categoryMap';

interface ICategoriesRepo {
  create(category: Category): Promise<Category>;
  getById(id: string): Promise<Category | null>;
  getByIdAndUser(id: number, userId: string): Promise<Category | null>;
  getAllByUserId(userId: string): Promise<Category[]>;
  update(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
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

  async getById(id: string): Promise<Category | null> {
    const result = await this.knexService.connection.raw<{
      rows: ICategoryPersistence[];
    }>(
      `
        SELECT *
        FROM categories
        WHERE id = :id
      `,
      { id },
    );
    if (result.rows.length === 0) {
      return null;
    }
    return CategoryMap.persistenceToDomain(result.rows[0]);
  }

  async getByIdAndUser(id: number, userId: string): Promise<Category | null> {
    const result = await this.knexService.connection.raw<{
      rows: ICategoryPersistence[];
    }>(
      `
        SELECT *
        FROM categories
        WHERE id = :id AND user_id = :userId
      `,
      {
        id,
        userId,
      },
    );
    if (result.rows.length === 0) {
      return null;
    }
    return CategoryMap.persistenceToDomain(result.rows[0]);
  }

  async update(categoryDomain: Category): Promise<Category> {
    categoryDomain.ensurePersisted();
    const category = CategoryMap.toPersistence(categoryDomain);
    const result = await this.knexService.connection.raw<{
      rows: ICategoryPersistence[];
    }>(
      `
        UPDATE categories
        SET name = :name, color = :color
        WHERE id = :id
        RETURNING *
      `,
      {
        id: category.id,
        name: category.name,
        color: category.color,
      },
    );
    return CategoryMap.persistenceToDomain(result.rows[0]);
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
    return result.rows.map((category) =>
      CategoryMap.persistenceToDomain(category),
    );
  }

  async delete(id: string): Promise<void> {
    await this.knexService.connection.transaction(async (trx) => {
      await trx.raw(
        `
          UPDATE activities
          SET category_id = NULL
          WHERE category_id = :id
        `,
        { id },
      );

      await trx.raw(
        `
          DELETE FROM categories
          WHERE id = :id
        `,
        { id },
      );
    });
  }
}
