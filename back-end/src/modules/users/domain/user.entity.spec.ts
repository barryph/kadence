import User from './user.entity';
import UserEmail from './value-objects/UserEmail';
import UserPassword from './value-objects/UserPassword';

describe('User', () => {
  it('creates a new user without an id', () => {
    const user = User.createNew({
      email: UserEmail.create('test@example.com'),
      password: UserPassword.create('password123'),
    });

    expect(user.isPersisted()).toBe(false);
    expect(user.email.value).toBe('test@example.com');
  });

  it('reconstitutes a persisted user', () => {
    const user = User.reconstitute({
      id: '1',
      email: UserEmail.create('test@example.com'),
      password: UserPassword.create('password123'),
    });

    expect(user.isPersisted()).toBe(true);
    expect(user.id).toBe('1');
  });
});
