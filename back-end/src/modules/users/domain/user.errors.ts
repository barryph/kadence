export class InvalidEmailError extends Error {
  constructor() {
    super('Email is invalid');
  }
}

export class PasswordsDontMatchError extends Error {
  constructor() {
    super("Passwords don't match");
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super('Email is already taken');
  }
}
