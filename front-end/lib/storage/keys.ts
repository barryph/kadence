/**
 * Versioned storage keys for client-persisted state.
 * Scope user-specific keys by userId so accounts on one device stay isolated.
 */
export const storageKeys = {
  activityQueue: (userId: string) => `activity-queue:v1:${userId}`,
} as const;
