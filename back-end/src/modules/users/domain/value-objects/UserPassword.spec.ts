import UserPassword from './UserPassword';

describe('UserPassword', () => {
  it('creates a password when valid', () => {
    const password = UserPassword.create('password123');
    expect(password.value).toBe('password123');
  });

  it('rejects blank passwords', () => {
    expect(() => UserPassword.create('')).toThrow('Password must not be blank');
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() => UserPassword.create('short')).toThrow(
      'Password must be at least 8 characters',
    );
  });

  it('hashes and compares passwords correctly', async () => {
    const password = UserPassword.create('password123');
    const hash = await password.hashPassword();
    const hashedPassword = UserPassword.create(hash);

    expect(await hashedPassword.comparePasswords('password123')).toBe(true);
    expect(await hashedPassword.comparePasswords('wrongpassword')).toBe(false);
  });
});
