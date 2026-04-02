import { Injectable } from '@nestjs/common';
import CategoriesRepo from '../repos/categories.repository';
import Category from '../domain/category.entity';
import CreateCategoryDTO from '../dtos/createCategory.dto';
import * as CategoryMap from '../mappers/categoryMap';
import { CategoryDTO } from '../mappers/categoryMap';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepo) {}

  async create(
    createCategoryDto: CreateCategoryDTO,
    userId: string,
  ): Promise<CategoryDTO> {
    const category = Category.createNew({
      userId,
      name: createCategoryDto.name,
      color: createCategoryDto.color,
    });

    const val = await this.categoriesRepo.create(category);
    return CategoryMap.toDTO(val);
  }

  async getAllByUserId(userId: string): Promise<CategoryDTO[]> {
    const categories = await this.categoriesRepo.getAllByUserId(userId);
    return categories.map((category) => CategoryMap.toDTO(category));
  }
}
