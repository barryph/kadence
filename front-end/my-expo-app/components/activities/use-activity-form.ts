import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { activitySchema, type ActivityFormValues } from './activity-schema';

// TODO: Consider keeping this WET
export function useActivityForm(initialValues?: Partial<ActivityFormValues>) {
  return useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      ticker: '',
      interval: 1,
      categoryId: undefined,
      lastDone: null,
      ...initialValues,
    },
  });
}
