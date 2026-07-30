import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IsAuthedGuard } from './is-authed.guard';

describe('IsAuthedGuard', () => {
  const guard = new IsAuthedGuard();

  function createContext(isAuthenticated: boolean): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          isAuthenticated: () => isAuthenticated,
        }),
      }),
    } as ExecutionContext;
  }

  it('allows authenticated requests', () => {
    expect(guard.canActivate(createContext(true))).toBe(true);
  });

  it('rejects unauthenticated requests', () => {
    expect(() => guard.canActivate(createContext(false))).toThrow(
      UnauthorizedException,
    );
  });
});
