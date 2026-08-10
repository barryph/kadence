import ServerError from 'src/shared/ServerError';

export class InvalidCredentialsError extends ServerError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid Credentials', 401);
  }
}

export class InvalidResetTokenError extends ServerError {
  constructor() {
    super('INVALID_RESET_TOKEN', 'Reset token is invalid or expired', 400);
  }
}

/**
 * Raised when a provider-issued credential fails verification or cannot be
 * resolved to an account. The message is intentionally generic so the endpoint
 * cannot be used to enumerate accounts or leak token-validation internals.
 */
export class OAuthCredentialError extends ServerError {
  constructor() {
    super('OAUTH_AUTH_FAILED', 'Authentication failed', 401);
  }
}
