import Category from '../domain/category.entity';

export interface CategoryDTO {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface ICategoryPersistence {
  id?: string;
  user_id: string;
  name: string;
  color: string;
}

export function toDTO(category: Category): CategoryDTO {
  category.ensurePersisted();
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
  };
}

export function toPersistence(category: Category): ICategoryPersistence {
  return {
    ...(category.isPersisted() && { id: category.id }),
    user_id: category.userId,
    name: category.name,
    color: category.color,
  };
}

export function persistenceToDomain(category: ICategoryPersistence): Category {
  return Category.createNew({
    id: category.id,
    userId: category.user_id,
    name: category.name,
    color: category.color,
  });
}
