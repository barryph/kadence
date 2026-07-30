import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ForgotPasswordRateLimitGuard } from './forgot-password-rate-limit.guard';
import { FORGOT_PASSWORD_RATE_LIMIT_MAX } from '../constants/password-reset.constants';

describe('ForgotPasswordRateLimitGuard', () => {
  const guard = new ForgotPasswordRateLimitGuard();

  function createContext(ip = '127.0.0.1'): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          socket: { remoteAddress: ip },
        }),
      }),
    } as ExecutionContext;
  }

  it('allows requests under the rate limit', () => {
    for (let i = 0; i < FORGOT_PASSWORD_RATE_LIMIT_MAX; i++) {
      expect(guard.canActivate(createContext('10.0.0.1'))).toBe(true);
    }
  });

  it('blocks requests over the rate limit', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < FORGOT_PASSWORD_RATE_LIMIT_MAX; i++) {
      guard.canActivate(createContext(ip));
    }

    expect(() => guard.canActivate(createContext(ip))).toThrow(HttpException);
    try {
      guard.canActivate(createContext(ip));
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });
});
