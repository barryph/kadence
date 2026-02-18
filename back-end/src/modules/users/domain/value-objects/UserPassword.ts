import * as bcrypt from 'bcryptjs';
import ServerError from 'src/shared/ServerError';

class PasswordMissingError extends ServerError {
  constructor() {
    super('PASSWORD_MISSING', 'Password must not be blank', 422);
  }
}
class PasswordTooShortError extends ServerError {
  constructor(message: string) {
    super('PASSWORD_TOO_SHORT', message, 422);
  }
}

export default class UserPassword {
  _value: string;

  private constructor(password: string) {
    this._value = password;
  }

  get value(): string {
    return this._value;
  }

  public async hashPassword(): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this._value, salt);
    return hash;
  }

  public async comparePasswords(plaintextPassword: string): Promise<boolean> {
    return bcrypt.compare(plaintextPassword, this._value);
  }

  private static isValidLength(password: string) {
    return password.length >= 8;
  }

  public static create(password: string): UserPassword {
    if (!password) {
      throw new PasswordMissingError();
    }

    if (!this.isValidLength(password)) {
      throw new PasswordTooShortError('Password must be at least 8 characters');
    }

    return new UserPassword(password);
  }
}
