import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearActivityQueue,
  getCachedActivityQueue,
  loadActivityQueue,
  resetActivityQueueCache,
  saveActivityQueue,
} from '@/lib/storage/activity-queue';
import { storageKeys } from '@/lib/storage/keys';

describe('activity queue storage', () => {
  beforeEach(async () => {
    resetActivityQueueCache();
    await AsyncStorage.clear();
  });

  it('loads an empty queue when nothing is stored', async () => {
    await expect(loadActivityQueue('user-1')).resolves.toEqual([]);
    expect(getCachedActivityQueue('user-1')).toEqual([]);
  });

  it('persists and reloads queued activity ids', async () => {
    await saveActivityQueue('user-1', [3, 1, 2]);

    resetActivityQueueCache();

    await expect(loadActivityQueue('user-1')).resolves.toEqual([3, 1, 2]);
    expect(await AsyncStorage.getItem(storageKeys.activityQueue('user-1'))).toBe(
      JSON.stringify([3, 1, 2]),
    );
  });

  it('skips AsyncStorage writes when the queue is unchanged', async () => {
    await saveActivityQueue('user-1', [1, 2]);
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();

    await saveActivityQueue('user-1', [1, 2]);

    expect(setItem).not.toHaveBeenCalled();
  });

  it('scopes queues per user', async () => {
    await saveActivityQueue('user-1', [1]);
    await saveActivityQueue('user-2', [2]);

    resetActivityQueueCache();

    await expect(loadActivityQueue('user-1')).resolves.toEqual([1]);
    await expect(loadActivityQueue('user-2')).resolves.toEqual([2]);
  });

  it('ignores corrupt stored values', async () => {
    await AsyncStorage.setItem(storageKeys.activityQueue('user-1'), '{bad');

    await expect(loadActivityQueue('user-1')).resolves.toEqual([]);
  });

  it('clears stored and cached queue data', async () => {
    await saveActivityQueue('user-1', [1]);
    await clearActivityQueue('user-1');

    expect(getCachedActivityQueue('user-1')).toBeUndefined();
    expect(
      await AsyncStorage.getItem(storageKeys.activityQueue('user-1')),
    ).toBeNull();
  });

  it('resolves rapid concurrent saves to the latest queue', async () => {
    await Promise.all([
      saveActivityQueue('user-1', [1]),
      saveActivityQueue('user-1', [1, 2]),
      saveActivityQueue('user-1', [2]),
    ]);

    expect(getCachedActivityQueue('user-1')).toEqual([2]);
    expect(await AsyncStorage.getItem(storageKeys.activityQueue('user-1'))).toBe(
      JSON.stringify([2]),
    );
  });
});
