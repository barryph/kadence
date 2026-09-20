import { EmailColors, EmailFonts } from './email-theme';

/**
 * The theme is the one place a colour can be introduced, so these tests guard
 * the two properties that make a security email legible: every text colour
 * clears WCAG AA against the surface it is painted on, and nothing in the
 * palette can turn into a client-specific gradient or translucent fill.
 *
 * Contrast maths mirrors WCAG 2.1: sRGB channels linearised, then the standard
 * (L1 + 0.05) / (L2 + 0.05) ratio.
 */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );

  return (lighter + 0.05) / (darker + 0.05);
}

describe('email theme', () => {
  it('paints a light theme: the card is lighter than the page', () => {
    expect(relativeLuminance(EmailColors.card)).toBeGreaterThan(
      relativeLuminance(EmailColors.canvas),
    );
    // White text on white would mean the palette was copied from the dark app.
    expect(EmailColors.card).toBe('#ffffff');
    expect(EmailColors.textPrimary).toBe('#111111');
  });

  it('clears WCAG AA (4.5:1) for every text/surface pairing in use', () => {
    const pairings: Array<[string, string, string]> = [
      ['heading', EmailColors.textPrimary, EmailColors.card],
      ['body', EmailColors.textSecondary, EmailColors.card],
      ['footnote', EmailColors.textMuted, EmailColors.card],
      ['badge and wordmark suffix', EmailColors.textSubtle, EmailColors.card],
      ['footer', EmailColors.textMuted, EmailColors.surface],
      ['postscript on the page', EmailColors.textSubtle, EmailColors.canvas],
      ['link on the card', EmailColors.link, EmailColors.card],
      [
        'footer link on the inset surface',
        EmailColors.link,
        EmailColors.surface,
      ],
      ['badge label', EmailColors.brand, EmailColors.brandSoft],
      ['white on the primary button', '#ffffff', EmailColors.brand],
      ['white on the destructive button', '#ffffff', EmailColors.danger],
      ['expiry callout', EmailColors.warning, EmailColors.warningSurface],
      ['success callout', EmailColors.success, EmailColors.successSurface],
      ['danger callout', EmailColors.danger, EmailColors.dangerSurface],
      ['error copy', EmailColors.dangerText, EmailColors.card],
    ];

    for (const [role, foreground, background] of pairings) {
      const ratio = contrast(foreground, background);
      // Reported as a named object so a failure says which pair regressed.
      expect({ role, passes: ratio >= 4.5 }).toEqual({ role, passes: true });
    }
  });

  it('uses only solid hex colours, so no client has to parse rgba', () => {
    // The card shadow is the single documented exception: it is decoration.
    const { cardShadow, ...fills } = EmailColors;
    expect(cardShadow).toContain('rgba(');

    for (const [token, value] of Object.entries(fills)) {
      // A named object keeps the failing token in the assertion message.
      expect({ token, solid: /^#[0-9a-f]{6}$/.test(value) }).toEqual({
        token,
        solid: true,
      });
    }
  });

  it('ships no web font: the type stacks are all local faces', () => {
    for (const [token, stack] of Object.entries(EmailFonts)) {
      expect({
        token,
        local: !/https?:|\.woff|@font-face/.test(stack),
      }).toEqual({
        token,
        local: true,
      });
      expect(stack).toMatch(/system-ui|ui-monospace/);
    }
  });
});
