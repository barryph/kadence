import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityTickerField() {
  const { control } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="ticker"
      render={({ field, fieldState }) => (
        <Input
          label="Ticker (optional)"
          placeholder="Ticker"
          value={field.value}
          onChangeText={field.onChange}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
