import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityIntervalField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="interval"
      render={({ field }) => (
        <Input
          label="Interval (days)"
          placeholder="Interval (days)"
          keyboardType="number-pad"
          value={String(field.value)}
          onChangeText={field.onChange}
          errorMessage={errors.interval?.message}
        />
      )}
    />
  );
}
