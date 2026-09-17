import { QueryClient } from '@tanstack/react-query';

import { ErrorCode, type TErrorCode } from '@/api/api.types';
import { ApiError } from '@/lib/query/unwrap';

/**
 * Failures worth one more attempt. A request that never reached the server
 * (`NETWORK_ERROR`) or that the server failed without blaming the request
 * (`GENERIC_ERROR`, e.g. a 5xx) may succeed on a retry.
 */
const RETRYABLE_ERROR_CODES = new Set<TErrorCode>([
  ErrorCode.NETWORK_ERROR,
  ErrorCode.GENERIC_ERROR,
]);

/**
 * Retries only transient failures.
 *
 * Retrying a definitive rejection is wasted time and a worse error experience:
 * it delays the message by the backoff, and for a 401 it re-broadcasts
 * "session ended" on every attempt.
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof ApiError) {
    return RETRYABLE_ERROR_CODES.has(error.appError.code);
  }
  // An unexpected error type: one retry is still reasonable.
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
      // Send the request even when NetInfo reports no connection. The default
      // ('online') parks the query in `fetchStatus: 'paused'` with
      // `status: 'pending'`, which every screen renders as an endless loading
      // state: no error, no retry, and nothing for the user to act on.
      // Attempting the request instead fails fast and surfaces a real error.
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      // Mutations pause under the default 'online' mode too, which leaves
      // `await mutateAsync()` pending forever: no toast and no error for an
      // action that was never sent, and the write is lost if the process ends.
      networkMode: 'offlineFirst',
    },
  },
});
