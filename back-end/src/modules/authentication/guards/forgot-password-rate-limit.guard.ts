import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  FORGOT_PASSWORD_RATE_LIMIT_MAX,
  FORGOT_PASSWORD_RATE_LIMIT_TTL_MS,
} from '../constants/password-reset.constants';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class ForgotPasswordRateLimitGuard implements CanActivate {
  private readonly requestsByIp = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientKey = this.getClientKey(request);
    const now = Date.now();
    const entry = this.requestsByIp.get(clientKey);

    if (!entry || entry.resetAt <= now) {
      this.requestsByIp.set(clientKey, {
        count: 1,
        resetAt: now + FORGOT_PASSWORD_RATE_LIMIT_TTL_MS,
      });
      return true;
    }

    if (entry.count >= FORGOT_PASSWORD_RATE_LIMIT_MAX) {
      throw new HttpException(
        'Too many password reset requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }

  private getClientKey(request: Request): string {
    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }
}
