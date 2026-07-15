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
