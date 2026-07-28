import {
  emailSchema,
  loginPasswordSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../auth-schemas';

describe('auth-schemas', () => {
  describe('emailSchema', () => {
    it('accepts a valid email', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
    });

    it('rejects an invalid email', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });

    it('rejects an empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('loginPasswordSchema', () => {
    it('accepts any non-empty password', () => {
      expect(loginPasswordSchema.safeParse('secret').success).toBe(true);
    });

    it('rejects an empty password', () => {
      const result = loginPasswordSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('accepts a password of at least 8 characters', () => {
      expect(passwordSchema.safeParse('password123').success).toBe(true);
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('short');
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'any',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'secret' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        passwordConfirm: 'different123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('requires a valid email', () => {
      expect(
        forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success,
      ).toBe(true);
    });
  });

  describe('resetPasswordSchema', () => {
    it('requires a password of at least 8 characters', () => {
      const result = resetPasswordSchema.safeParse({ password: 'newpass123' });
      expect(result.success).toBe(true);
    });
  });
});
