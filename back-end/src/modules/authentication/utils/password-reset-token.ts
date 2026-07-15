import { createHash, randomBytes } from 'crypto';
import { PASSWORD_RESET_TOKEN_BYTES } from '../constants/password-reset.constants';

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generatePasswordResetToken(): {
  token: string;
  hashedToken: string;
} {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
  return {
    token,
    hashedToken: hashPasswordResetToken(token),
  };
}
