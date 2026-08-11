export type SocialAuthErrorCode =
  | 'cancelled'
  | 'unavailable'
  | 'network'
  | 'failed';

export class SocialAuthError extends Error {
  readonly code: SocialAuthErrorCode;

  constructor(code: SocialAuthErrorCode, message: string) {
    super(message);
    this.name = 'SocialAuthError';
    this.code = code;
  }
}

export function isSocialAuthError(error: unknown): error is SocialAuthError {
  return error instanceof SocialAuthError;
}
