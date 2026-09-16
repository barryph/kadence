import { Colors, withAlpha } from '@/constants/theme';
import {
  EmailColors,
  withAlpha as emailWithAlpha,
} from '../../../back-end/src/shared/email/email-theme';

/**
 * Brand tokens the email theme mirrors from the app theme. The two files are
 * deliberately independent copies (see `docs/design-system.md`), so this guards
 * the colours that must not drift apart.
 */
const SHARED_TOKENS = [
  'canvas',
  'canvasMid',
  'accent',
  'accentGlow',
  'accentBright',
  'cyan',
  'success',
  'danger',
  'textPrimary',
] as const;

describe('frontend/email theme parity', () => {
  it.each(SHARED_TOKENS)('keeps %s in sync', (token) => {
    expect(EmailColors[token]).toBe(Colors[token]);
  });

  it('composites alpha identically in both themes', () => {
    expect(emailWithAlpha(EmailColors.accent, 0.42)).toBe(
      withAlpha(Colors.accent, 0.42),
    );
  });
});
