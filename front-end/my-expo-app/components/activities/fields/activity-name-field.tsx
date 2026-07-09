import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityNameField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <Input
          label="Name"
          placeholder="Name"
          value={field.value}
          onChangeText={field.onChange}
          errorMessage={errors.name?.message}
        />
      )}
    />
  );
}
