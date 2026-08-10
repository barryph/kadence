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

    // Social authentication (client-side mapped, never from the backend)
    SOCIAL_AUTH_CANCELLED: 'Sign in was cancelled.',
    SOCIAL_AUTH_UNAVAILABLE: 'This sign-in method is not available.',
    SOCIAL_AUTH_FAILED: 'Sign in failed. Please try again.',

    // Generic errors
    GENERIC_ERROR: 'Something went wrong, please try again.',
    NETWORK_ERROR: 'Something went wrong, please try again.',
  };

  mapError(serverError: ServerError): AppError {
    const message = this.errorMap[serverError.code as TErrorCode];

    if (message) {
      return {
        code: serverError.code as TErrorCode,
        message,
      };
    }

    return {
      code: ErrorCode.GENERIC_ERROR,
      message:
        serverError.message || 'An unexpected error occured. Please try again.',
    };
  }
}

export const errorMapper = new ErrorMapper();
