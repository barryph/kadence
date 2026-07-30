import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from './password-reset-token';

describe('password-reset-token', () => {
  it('hashes a token consistently', () => {
    const token = 'abc123';
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });

  it('generates a token and matching hash', () => {
    const { token, hashedToken } = generatePasswordResetToken();
    expect(token).toHaveLength(40);
    expect(hashedToken).toBe(hashPasswordResetToken(token));
  });
});
