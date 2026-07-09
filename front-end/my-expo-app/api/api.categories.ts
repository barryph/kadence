import { apiClient, type OptionalOptions } from './api.client';
// TODO: move to this file
import { ICategory } from './api.activity';

interface GetAllCategoriesByUserResponse {
  categories: ICategory[];
}

interface CreateCategoryDTO extends Omit<Omit<ICategory, 'id'>, 'userId'> { }

interface CreateCategoryResponse {
  category: ICategory;
}

export const categoriesAPI = {
  createCategory(body: CreateCategoryDTO, options?: OptionalOptions) {
    return apiClient.post<CreateCategoryResponse>('/categories', body, options);
  },

  getAllByUser(options?: OptionalOptions) {
    return apiClient.get<GetAllCategoriesByUserResponse>(
      '/categories/',
      options,
    );
  },
};
