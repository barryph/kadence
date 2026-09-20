import { Colors } from '@/constants/theme';
import { EmailColors } from '../../../back-end/src/shared/email/email-theme';

/**
 * The app and the transactional email used to share one dark palette. They no
 * longer do: the app is dark-only, while security email follows the light theme
 * of the public account site (`kadence-static/src/styles/global.css`), because a
 * white card reads as trustworthy where a dark gradient reads as marketing.
 *
 * There is nothing left to keep byte-identical, so this guards the shape of the
 * decision instead: the email palette stays light and does not quietly reabsorb
 * the app's dark surfaces.
 */
describe('frontend/email palette separation', () => {
  it('keeps the app dark and the email light', () => {
    expect(Colors.canvas).toBe('#050711');
    expect(EmailColors.card).toBe('#ffffff');
    expect(EmailColors.textPrimary).toBe('#111111');
    expect(EmailColors.canvas).toBe('#f8fafc');
  });

  it('keeps every email surface light', () => {
    const surfaces = [
      EmailColors.canvas,
      EmailColors.card,
      EmailColors.surface,
      EmailColors.warningSurface,
      EmailColors.successSurface,
      EmailColors.dangerSurface,
    ];

    for (const surface of surfaces) {
      const channel = parseInt(surface.slice(1, 3), 16);
      expect({ surface, light: channel >= 0xf0 }).toEqual({
        surface,
        light: true,
      });
    }
  });

  it('keeps the email actions on the site blue, not the app accent', () => {
    expect(EmailColors.brand).toBe('#0a4d9c');
    expect(EmailColors.brand).not.toBe(Colors.accent);
  });
});
