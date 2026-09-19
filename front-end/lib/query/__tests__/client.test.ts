import { shouldRetryQuery } from '@/lib/query/client';
import { ErrorCode } from '@/api/api.types';
import { ApiError } from '@/lib/query/unwrap';

function apiError(code: keyof typeof ErrorCode) {
  return new ApiError({ code, message: 'nope' });
}

describe('shouldRetryQuery', () => {
  it('retries a request that never reached the server', () => {
    expect(shouldRetryQuery(0, apiError('NETWORK_ERROR'))).toBe(true);
  });

  it('retries a server failure that blamed no specific input', () => {
    expect(shouldRetryQuery(0, apiError('GENERIC_ERROR'))).toBe(true);
  });

  it('does not retry a definitive rejection', () => {
    // These fail identically on a retry; retrying only delays the message, and
    // for a 401 it re-broadcasts the session-ended event.
    for (const code of [
      'UNAUTHORIZED',
      'SESSION_EXPIRED',
      'INVALID_CREDENTIALS',
      'EMAIL_TAKEN',
      'INVALID_RESET_TOKEN',
      'ACCOUNT_NOT_FOUND',
    ] as const) {
      expect(shouldRetryQuery(0, apiError(code))).toBe(false);
    }
  });

  it('gives up after one retry', () => {
    expect(shouldRetryQuery(1, apiError('NETWORK_ERROR'))).toBe(false);
  });
});
