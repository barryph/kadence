import { getJSON, removeItem, setJSON } from '@/lib/storage/client';
import { storageKeys } from '@/lib/storage/keys';

/** In-memory cache: avoids re-reading AsyncStorage on remounts. */
const memoryCache = new Map<string, number[]>();
/** Dedupes concurrent loads for the same user so only one AsyncStorage read runs. */
const inflightLoads = new Map<string, Promise<number[]>>();
/** Monotonic write generation per user — drops stale AsyncStorage writes. */
const writeGeneration = new Map<string, number>();

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value;
}

function serializeIds(ids: Iterable<number>): string {
  return JSON.stringify([...ids].sort((a, b) => a - b));
}

export function getCachedActivityQueue(userId: string): number[] | undefined {
  return memoryCache.get(userId);
}

export async function loadActivityQueue(userId: string): Promise<number[]> {
  const cached = memoryCache.get(userId);
  if (cached !== undefined) return cached;

  const inflight = inflightLoads.get(userId);
  if (inflight) return inflight;

  const loadPromise = getJSON<unknown>(storageKeys.activityQueue(userId))
    .then((stored) => {
      const ids = normalizeIds(stored);
      memoryCache.set(userId, ids);
      return ids;
    })
    .finally(() => {
      inflightLoads.delete(userId);
    });

  inflightLoads.set(userId, loadPromise);
  return loadPromise;
}

export async function saveActivityQueue(
  userId: string,
  ids: Iterable<number>,
): Promise<void> {
  const next = [...ids];
  const previous = memoryCache.get(userId);

  if (previous && serializeIds(previous) === serializeIds(next)) {
    return;
  }

  memoryCache.set(userId, next);

  const generation = (writeGeneration.get(userId) ?? 0) + 1;
  writeGeneration.set(userId, generation);

  const key = storageKeys.activityQueue(userId);
  await setJSON(key, next);

  // A newer save may have started while we were writing. Persist the latest
  // cached value so rapid toggles cannot leave stale data on disk.
  if (writeGeneration.get(userId) !== generation) {
    await setJSON(key, memoryCache.get(userId) ?? []);
  }
}

export async function clearActivityQueue(userId: string): Promise<void> {
  memoryCache.delete(userId);
  inflightLoads.delete(userId);
  writeGeneration.delete(userId);
  await removeItem(storageKeys.activityQueue(userId));
}

/** Test helper — clears in-memory caches between cases. */
export function resetActivityQueueCache(): void {
  memoryCache.clear();
  inflightLoads.clear();
  writeGeneration.clear();
}
