import type { IActivityClient } from '@/api/api.activity';

export const testActivity: IActivityClient = {
  id: 1,
  userId: 'user-1',
  name: 'Morning Run',
  ticker: 'RUN',
  interval: 7,
  categoryId: 1,
  daysUntil: 3,
  queued: false,
};

export const testActivityAlt: IActivityClient = {
  id: 2,
  userId: 'user-1',
  name: 'Weekly Review',
  ticker: 'REV',
  interval: 7,
  categoryId: 2,
  daysUntil: 1,
  queued: true,
};

export const testActivities: IActivityClient[] = [testActivity, testActivityAlt];
