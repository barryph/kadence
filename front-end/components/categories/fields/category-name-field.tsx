import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import { CategoryFormValues } from '../category-modal';

export default function CategoryNameField() {
  const { control } = useFormContext<CategoryFormValues>();

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <>
          <Input
            label="Name"
            placeholder="Legs"
            value={field.value}
            onChangeText={field.onChange}
            errorMessage={fieldState.error?.message}
          />
        </>
      )}
    />
  );
}
