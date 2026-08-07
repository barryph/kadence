import { useEffect, useRef, useState } from 'react';

import {
  getCachedActivityQueue,
  loadActivityQueue,
  saveActivityQueue,
} from '@/lib/storage/activity-queue';

/**
 * Persisted activity queue for the current user.
 * Storage details stay in lib/storage — screens only toggle/remove IDs.
 */
export function useActivityQueue(userId: string) {
  const [queuedIds, setQueuedIds] = useState<Set<number>>(() => {
    const cached = getCachedActivityQueue(userId);
    return cached !== undefined ? new Set(cached) : new Set();
  });
  const [isHydrated, setIsHydrated] = useState(
    () => getCachedActivityQueue(userId) !== undefined,
  );
  // State drives renders; ref lets mutators read the latest set across rapid
  // taps before React re-renders (avoids lost toggles from a stale closure).
  const queuedIdsRef = useRef(queuedIds);
  queuedIdsRef.current = queuedIds;

  useEffect(() => {
    const cached = getCachedActivityQueue(userId);
    if (cached !== undefined) {
      const next = new Set(cached);
      queuedIdsRef.current = next;
      setQueuedIds(next);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    setIsHydrated(false);

    void loadActivityQueue(userId).then((ids) => {
      if (cancelled) return;
      const next = new Set(ids);
      queuedIdsRef.current = next;
      setQueuedIds(next);
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) {
    throw new Error('useActivityQueue requires a userId');
  }

  function commitQueue(next: Set<number>) {
    queuedIdsRef.current = next;
    setQueuedIds(next);
    void saveActivityQueue(userId, next);
  }

  function toggleQueuedActivity(activityId: number) {
    if (!isHydrated) return;

    const next = new Set(queuedIdsRef.current);
    if (next.has(activityId)) {
      next.delete(activityId);
    } else {
      next.add(activityId);
    }

    commitQueue(next);
  }

  function removeFromQueue(activityId: number) {
    if (!isHydrated) return;
    if (!queuedIdsRef.current.has(activityId)) return;

    const next = new Set(queuedIdsRef.current);
    next.delete(activityId);

    commitQueue(next);
  }

  return {
    queuedIds,
    isHydrated,
    toggleQueuedActivity,
    removeFromQueue,
  };
}
