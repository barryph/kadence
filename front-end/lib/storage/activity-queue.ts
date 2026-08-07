import { getJSON, removeItem, setJSON } from '@/lib/storage/client';
import { storageKeys } from '@/lib/storage/keys';

/** In-memory cache: avoids re-reading AsyncStorage on remounts. */
const memoryCache = new Map<string, number[]>();
/** Dedupes concurrent loads for the same user so only one AsyncStorage read runs. */
const inflightLoads = new Map<string, Promise<number[]>>();
/** Coalesced write per user — concurrent saves share one flush to disk. */
const inflightWrites = new Map<string, Promise<void>>();
/** Last value written to disk, used to skip redundant flushes. */
const lastPersisted = new Map<string, string>();

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value;
}

function serializeIds(ids: Iterable<number>): string {
  return JSON.stringify([...ids]);
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

async function flushActivityQueue(userId: string): Promise<void> {
  // Yield so concurrent saveActivityQueue calls in the same tick can update cache.
  await Promise.resolve();

  const key = storageKeys.activityQueue(userId);

  while (true) {
    const ids = memoryCache.get(userId) ?? [];
    const serialized = serializeIds(ids);

    if (lastPersisted.get(userId) === serialized) {
      return;
    }

    await setJSON(key, ids);
    lastPersisted.set(userId, serialized);
  }
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

  let inflight = inflightWrites.get(userId);
  if (!inflight) {
    inflight = flushActivityQueue(userId).finally(() => {
      inflightWrites.delete(userId);
    });
    inflightWrites.set(userId, inflight);
  }

  return inflight;
}

export async function clearActivityQueue(userId: string): Promise<void> {
  const inflightWrite = inflightWrites.get(userId);

  memoryCache.delete(userId);
  inflightLoads.delete(userId);
  lastPersisted.delete(userId);
  inflightWrites.delete(userId);

  if (inflightWrite) {
    await inflightWrite.catch(() => {});
  }

  await removeItem(storageKeys.activityQueue(userId));
}

/** Test helper — clears in-memory caches between cases. */
export function resetActivityQueueCache(): void {
  memoryCache.clear();
  inflightLoads.clear();
  inflightWrites.clear();
  lastPersisted.clear();
}
