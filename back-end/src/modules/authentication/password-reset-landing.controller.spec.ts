import type { Response } from 'express';
import { PasswordResetLandingController } from './password-reset-landing.controller';

interface MockResponse {
  status: jest.Mock;
  set: jest.Mock;
  send: jest.Mock;
}

function createResponse(): MockResponse {
  const res = {} as MockResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function sentHtml(res: MockResponse): string {
  return res.send.mock.calls[0][0] as string;
}

function sentHeaders(res: MockResponse): Record<string, string> {
  return res.set.mock.calls[0][0] as Record<string, string>;
}

describe('PasswordResetLandingController', () => {
  const originalDeepLink = process.env.EMAIL_PASSWORD_RESET_DEEP_LINK;

  afterEach(() => {
    if (originalDeepLink === undefined) {
      delete process.env.EMAIL_PASSWORD_RESET_DEEP_LINK;
    } else {
      process.env.EMAIL_PASSWORD_RESET_DEEP_LINK = originalDeepLink;
    }
  });

  it('opens the app deep link with the token appended', () => {
    process.env.EMAIL_PASSWORD_RESET_DEEP_LINK = 'kadence://reset-password';
    const controller = new PasswordResetLandingController();
    const res = createResponse();

    controller.resetPasswordLanding(
      'tok en/with+chars',
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(sentHtml(res)).toContain(
      'kadence://reset-password?token=tok%20en%2Fwith%2Bchars',
    );
  });

  it('marks the token-bearing response uncacheable and referral-free', () => {
    const controller = new PasswordResetLandingController();
    const res = createResponse();

    controller.resetPasswordLanding('abc123', res as unknown as Response);

    const headers = sentHeaders(res);
    expect(headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['X-Robots-Tag']).toContain('noindex');
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(headers['Content-Security-Policy']).toContain("script-src 'nonce-");
  });

  it('shows the incomplete-link page instead of opening the app when the token is missing', () => {
    const controller = new PasswordResetLandingController();
    const res = createResponse();

    controller.resetPasswordLanding(undefined, res as unknown as Response);

    expect(sentHtml(res)).toContain('Reset link incomplete');
    expect(sentHtml(res)).not.toContain('kadence://');
  });

  it('treats a repeated token parameter as missing', () => {
    const controller = new PasswordResetLandingController();
    const res = createResponse();

    controller.resetPasswordLanding(
      ['a', 'b'] as unknown as string,
      res as unknown as Response,
    );

    expect(sentHtml(res)).toContain('Reset link incomplete');
  });
});
