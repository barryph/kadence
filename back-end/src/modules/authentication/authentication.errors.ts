import ServerError from 'src/shared/ServerError';

export class InvalidCredentialsError extends ServerError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid Credentials', 401);
  }
}
