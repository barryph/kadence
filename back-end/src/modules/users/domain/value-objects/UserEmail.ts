import ServerError from 'src/shared/ServerError';

class InvalidEmailError extends ServerError {
  constructor() {
    super('INVALID_EMAIL', 'Email is invalid', 422);
  }
}

export default class UserEmail {
  _value: string;

  private constructor(email: string) {
    this._value = email;
  }

  get value(): string {
    return this._value;
  }

  private static isValidEmail(email: string) {
    // TODO: Validate
    return true;
  }

  public static create(email: string): UserEmail {
    if (!this.isValidEmail(email)) {
      throw new InvalidEmailError();
    }
    return new UserEmail(email);
  }
}
