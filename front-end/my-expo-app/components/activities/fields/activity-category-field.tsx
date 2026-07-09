import { Controller, useFormContext } from 'react-hook-form';
import CategorySelect from '@/components/categories/category-select';
import type { ICategory } from '@/api/api.activity';
import type { ActivityFormValues } from '../activity-schema';

interface Props {
  categories: ICategory[];
  onCreate(category: ICategory): void;
}

export default function ActivityCategoryField({ categories, onCreate }: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field }) => (
        <CategorySelect
          label="Category (optional)"
          placeholder="Choose a Category"
          options={categories}
          onCreate={onCreate}
          onSelect={(category) => field.onChange(category.id)}
          errorMessage={errors.categoryId?.message}
        />
      )}
    />
  );
}
