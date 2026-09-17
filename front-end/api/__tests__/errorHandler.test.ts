import { errorMapper } from '../errorHandler';
import { ErrorCode } from '../api.types';

describe('errorMapper', () => {
  it('maps INVALID_CREDENTIALS to a user-friendly message', () => {
    const result = errorMapper.mapError({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid credentials',
    });
    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
    expect(result.message).toBe('Invalid email or password, please try again.');
  });

  it('maps EMAIL_TAKEN to a user-friendly message', () => {
    const result = errorMapper.mapError({
      code: ErrorCode.EMAIL_TAKEN,
      message: 'Email taken',
    });
    expect(result.message).toBe('Email Is already taken.');
  });

  it('maps INVALID_RESET_TOKEN to a user-friendly message', () => {
    const result = errorMapper.mapError({
      code: ErrorCode.INVALID_RESET_TOKEN,
      message: 'Token expired',
    });
    expect(result.message).toBe('Reset token is invalid or expired');
  });

  it('maps SESSION_EXPIRED to a sign-in-again message', () => {
    const result = errorMapper.mapError({
      code: ErrorCode.SESSION_EXPIRED,
      message: 'Your session has ended. Please sign in again.',
    });
    expect(result.code).toBe(ErrorCode.SESSION_EXPIRED);
    expect(result.message).toBe(
      'Your session has ended. Please sign in again.',
    );
  });

  it('falls back to server message for unknown error codes', () => {
    const result = errorMapper.mapError({
      code: 'UNKNOWN_CODE',
      message: 'Something specific happened',
    });
    expect(result.code).toBe(ErrorCode.GENERIC_ERROR);
    expect(result.message).toBe('Something specific happened');
  });

  it('maps an unlabelled 401 to UNAUTHORIZED', () => {
    // The API reports an expired session as a bare 401 with no error code
    // (AllExceptionsFilter omits it for HttpException responses).
    const result = errorMapper.mapError(
      { code: '', message: 'Not authenticated' },
      401,
    );
    expect(result.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(result.message).toBe('Your session has expired. Please sign in again.');
  });

  it('keeps a labelled 401 as the credential error it is', () => {
    // A rejected sign-in also returns 401; it must not be reported as an
    // expired session.
    const result = errorMapper.mapError(
      { code: ErrorCode.INVALID_CREDENTIALS, message: 'Bad credentials' },
      401,
    );
    expect(result.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('maps a rejected provider credential to a sign-in failure, not a session ending', () => {
    // After Google access is revoked, the next Google credential the backend
    // sees is rejected with 401 OAUTH_AUTH_FAILED. That is a sign-in attempt
    // failing, not the user's existing application session ending, so it must
    // not become UNAUTHORIZED (which clears local auth state).
    const result = errorMapper.mapError(
      { code: ErrorCode.OAUTH_AUTH_FAILED, message: 'Authentication failed' },
      401,
    );
    expect(result.code).toBe(ErrorCode.OAUTH_AUTH_FAILED);
    expect(result.message).toBe('Sign in failed. Please try again.');
  });

  it('falls back to generic message when server message is empty', () => {
    const result = errorMapper.mapError({
      code: 'UNKNOWN_CODE',
      message: '',
    });
    expect(result.message).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});
