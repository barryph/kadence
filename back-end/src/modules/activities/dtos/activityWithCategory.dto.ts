import { CategoryDTO } from '../../categories/mappers/categoryMap';

export interface ActivityWithCategoryDTO {
  id: string;
  userId: string;
  name: string;
  ticker?: string;
  interval: number;
  categoryId?: string;
  category?: CategoryDTO;
}
