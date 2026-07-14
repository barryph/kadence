import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityIntervalField() {
  const { control } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="interval"
      render={({ field, fieldState }) => (
        <Input
          label="Interval (days)"
          placeholder="Interval (days)"
          keyboardType="number-pad"
          value={String(field.value)}
          onChangeText={field.onChange}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
