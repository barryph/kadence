import { Controller, Get, Query, Res } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import {
  loadEmailConfig,
  type EmailConfig,
} from 'src/shared/email/email.config';
import { appendPasswordResetToken } from 'src/shared/email/password-reset-link';
import { renderPasswordResetLandingPage } from './password-reset-landing.page';

/**
 * Public handoff endpoint behind the link in the password reset email:
 * `GET /reset-password?token=...`.
 *
 * It exists so the emailed URL can live on the verified sending domain (which
 * is what Resend expects) while the user still lands in the app's
 * `reset-password` screen. The response is a small document that opens the
 * `kadence://reset-password` deep link, with a button fallback for in-app
 * browsers that ignore an automatic scheme change.
 *
 * The token is deliberately opaque here. It is passed through untouched and
 * never validated, redeemed or logged: GETs are prefetched by mail clients and
 * security scanners, redeeming a single-use credential on one would burn it,
 * and answering differently for a known token would make this a token oracle.
 * `POST /auth/reset-password` remains the only place a token is redeemed.
 */
@Controller('reset-password')
export class PasswordResetLandingController {
  private readonly config: EmailConfig = loadEmailConfig();

  @Get()
  resetPasswordLanding(
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ): void {
    const hasToken = typeof token === 'string' && token.length > 0;
    const nonce = randomBytes(16).toString('base64');
    const deepLink = hasToken
      ? appendPasswordResetToken(this.config.passwordResetDeepLink, token)
      : null;

    res
      .status(200)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        // The URL carries a single-use credential: keep it out of caches and
        // out of any `Referer` a follow-up navigation might send.
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        // The page needs its own inline style/script and nothing else. A
        // strict per-response nonce policy keeps the token-bearing document
        // from loading or exfiltrating anything.
        'Content-Security-Policy': [
          "default-src 'none'",
          `style-src 'nonce-${nonce}'`,
          `script-src 'nonce-${nonce}'`,
          "base-uri 'none'",
          "form-action 'none'",
          "frame-ancestors 'none'",
        ].join('; '),
      })
      .send(renderPasswordResetLandingPage({ deepLink, nonce }));
  }
}
