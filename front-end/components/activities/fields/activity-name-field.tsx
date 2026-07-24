import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityNameField() {
  const { control } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="name"
      render={({ field, fieldState }) => (
        <Input
          label="Name"
          placeholder="Squat"
          value={field.value}
          onChangeText={field.onChange}
          errorMessage={fieldState.error?.message}
          required
        />
      )}
    />
  );
}
