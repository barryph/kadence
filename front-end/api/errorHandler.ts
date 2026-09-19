import {
  ErrorCode,
  type AppError,
  type ServerError,
  type TErrorCode,
} from './api.types';

// For now we keep the mapped values as humble strings, we could extend this to include a field property, metadata, etc
type ErrorMap = Record<TErrorCode, string>;

class ErrorMapper {
  // TODO: Make this per request
  private errorMap: ErrorMap = {
    INVALID_CREDENTIALS: 'Invalid email or password, please try again.',
    EMAIL_TAKEN: 'Email Is already taken.',
    INVALID_RESET_TOKEN: 'Reset token is invalid or expired',
    ACCOUNT_NOT_FOUND: 'This account no longer exists.',
    PROVIDER_REVOCATION_FAILED:
      "We couldn't disconnect your account from its provider. Nothing was deleted. Please try again.",
    // A rejected provider credential is a sign-in failure, not an ended
    // session: without this entry it falls through to the bare-401 →
    // UNAUTHORIZED mapping, which tells a signed-out user their session expired
    // and broadcasts a spurious session-end to the auth layer.
    OAUTH_AUTH_FAILED: 'Sign in failed. Please try again.',
    UNAUTHORIZED: 'Your session has expired. Please sign in again.',
    SESSION_EXPIRED: 'Your session has ended. Please sign in again.',

    // Social authentication (client-side mapped, never from the backend)
    SOCIAL_AUTH_CANCELLED: 'Sign in was cancelled.',
    SOCIAL_AUTH_UNAVAILABLE: 'This sign-in method is not available.',
    SOCIAL_AUTH_FAILED: 'Sign in failed. Please try again.',

    // Generic errors
    GENERIC_ERROR: 'Something went wrong, please try again.',
    // Matches the wording the API client uses when a request never reached the
    // server, so the same failure is not described two different ways.
    NETWORK_ERROR: 'Network error. Please check your connection.',
  };

  mapError(serverError: ServerError, httpStatus?: number): AppError {
    const message = this.errorMap[serverError.code as TErrorCode];

    if (message) {
      return {
        code: serverError.code as TErrorCode,
        message,
      };
    }

    // The API reports an expired or absent session as a bare 401 with no error
    // code (AllExceptionsFilter's HttpException branch omits it), so a signed-out
    // session would otherwise be downgraded to a generic error and the app would
    // never learn that it is no longer authenticated.
    if (httpStatus === 401) {
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: this.errorMap.UNAUTHORIZED,
      };
    }

    return {
      code: ErrorCode.GENERIC_ERROR,
      message:
        serverError.message ||
        'An unexpected error occurred. Please try again.',
    };
  }
}

export const errorMapper = new ErrorMapper();
