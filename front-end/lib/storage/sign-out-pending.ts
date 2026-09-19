import { getJSON, removeItem, setJSON } from '@/lib/storage/client';
import { storageKeys } from '@/lib/storage/keys';

/**
 * Records that the user asked to sign out but the server could not be reached,
 * so the server session is still alive and its cookie is still in the device's
 * cookie jar.
 *
 * Without this, the local sign-out would be undone on the next launch: the
 * boot session check would send the surviving cookie, get the user back, and
 * quietly sign them in again. The marker tells the next launch to stay signed
 * out and to retry ending the server session.
 */
export async function markSignOutPending(): Promise<void> {
  await setJSON(storageKeys.signOutPending, true);
}

export async function isSignOutPending(): Promise<boolean> {
  return (await getJSON<boolean>(storageKeys.signOutPending)) === true;
}

export async function clearSignOutPending(): Promise<void> {
  await removeItem(storageKeys.signOutPending);
}
