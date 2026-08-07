import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON helpers over AsyncStorage.
 * Components should depend on domain hooks/services, not this module directly.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`Failed to parse storage value for key "${key}"`);
    return null;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
