import { Controller, useFormContext } from 'react-hook-form';
import CategorySelect from '@/components/categories/category-select';
import type { ICategory } from '@/api/api.categories';
import type { ActivityFormValues } from '../activity-schema';

interface Props {
  categories: ICategory[];
  onCreate(category: ICategory): void;
}

export default function ActivityCategoryField({ categories, onCreate }: Props) {
  const { control, formState, getValues } =
    useFormContext<ActivityFormValues>();

  const categoryId = getValues('categoryId');
  const value = categories.find((category) => category.id === categoryId);

  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field }) => (
        <CategorySelect
          value={value}
          label="Category (optional)"
          placeholder="Choose a Category"
          categories={categories}
          onCreate={onCreate}
          onSelect={(category) => field.onChange(category.id)}
          onClear={() => field.onChange(null)}
          errorMessage={formState.errors.categoryId?.message}
        />
      )}
    />
  );
}
