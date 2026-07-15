import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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

  async edit(
    categoryId: string,
    createCategoryDto: CreateCategoryDTO,
    userId: string,
  ): Promise<CategoryDTO> {
    const category = await this.categoriesRepo.getById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    category.changeName(createCategoryDto.name);
    category.changeColor(createCategoryDto.color);

    const updated = await this.categoriesRepo.update(category);
    return CategoryMap.toDTO(updated);
  }

  async delete(categoryId: string, userId: string): Promise<void> {
    const category = await this.categoriesRepo.getById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.userId !== userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.categoriesRepo.delete(categoryId);
  }
}
