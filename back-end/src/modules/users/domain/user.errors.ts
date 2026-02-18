import ServerError from 'src/shared/ServerError';

export class PasswordsDontMatchError extends ServerError {
  constructor() {
    super('PASSWORDS_DONT_MATCH', "Passwords don't match");
  }
}

export class EmailTakenError extends ServerError {
  constructor() {
    super('EMAIL_TAKEN', 'Email is already taken');
  }
}
