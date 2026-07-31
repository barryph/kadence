import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, type ICategory } from '@/api/api.categories';
import { queryKeys } from '@/lib/query/keys';
import { unwrapApiResponse } from '@/lib/query/unwrap';

async function fetchCategories(): Promise<ICategory[]> {
  const resp = await categoriesAPI.getAllByUser();
  const data = unwrapApiResponse(resp);
  return data.categories;
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
  });
}
