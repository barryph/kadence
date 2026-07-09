import { Controller, useFormContext } from 'react-hook-form';
import Input from '@/components/base/input';
import type { ActivityFormValues } from '../activity-schema';

export default function ActivityTickerField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ActivityFormValues>();

  return (
    <Controller
      control={control}
      name="ticker"
      render={({ field }) => (
        <Input
          label="Ticker (optional)"
          placeholder="Ticker"
          value={field.value}
          onChangeText={field.onChange}
          errorMessage={errors.ticker?.message}
        />
      )}
    />
  );
}
