import { z } from 'zod';

export const activitySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be <= 30 characters'),
  ticker: z.string().max(5, 'Ticker must be 1-5 characters'),
  interval: z.coerce.number().min(1, 'Interval must be greater than 0'),
  categoryId: z.number().nullable(),
  lastDone: z.date().nullable().optional(),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
