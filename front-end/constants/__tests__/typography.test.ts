import { Colors } from '@/constants/theme';
import {
  FONT_SIZE,
  LINE_HEIGHT,
  resolveTypography,
} from '@/constants/typography';

describe('resolveTypography', () => {
  it('defaults to the body variant', () => {
    expect(resolveTypography({})).toMatchObject({
      fontFamily: 'IBMPlexMono_400Regular',
      fontSize: FONT_SIZE.lg,
      lineHeight: LINE_HEIGHT.mono.lg,
    });
  });

  it('resolves the mono weight to the matching registered family', () => {
    expect(resolveTypography({ font: 'mono', weight: '500' })).toMatchObject({
      fontFamily: 'IBMPlexMono_500Medium',
    });
    expect(resolveTypography({ font: 'mono', weight: '600' })).toMatchObject({
      fontFamily: 'IBMPlexMono_600SemiBold',
    });
    expect(resolveTypography({ font: 'mono', weight: '700' })).toMatchObject({
      fontFamily: 'IBMPlexMono_700Bold',
    });
  });

  it('uses a real fontWeight for the system face', () => {
    const style = resolveTypography({ font: 'system', weight: '600' });

    expect(style.fontFamily).toContain('system-ui');
    expect(style.fontWeight).toBe('600');
  });

  it('keeps family and weight independent', () => {
    // The same weight produces the same emphasis whichever family is chosen.
    expect(
      resolveTypography({ variant: 'body', font: 'mono', weight: '600' })
        .fontFamily,
    ).toBe('IBMPlexMono_600SemiBold');
    expect(
      resolveTypography({ variant: 'body', font: 'system', weight: '600' })
        .fontWeight,
    ).toBe('600');
  });

  it('gives each family its own line height for the same size', () => {
    const mono = resolveTypography({ variant: 'body', font: 'mono' });
    const system = resolveTypography({ variant: 'body', font: 'system' });

    expect(mono.fontSize).toBe(system.fontSize);
    expect(mono.lineHeight).toBe(LINE_HEIGHT.mono.lg);
    expect(system.lineHeight).toBe(LINE_HEIGHT.system.lg);
    expect(mono.lineHeight).not.toBe(system.lineHeight);
  });

  it('re-resolves the line height when the size changes', () => {
    const style = resolveTypography({ variant: 'body', size: '3xl' });

    expect(style.fontSize).toBe(FONT_SIZE['3xl']);
    expect(style.lineHeight).toBe(LINE_HEIGHT.mono['3xl']);
  });

  it('applies an explicit line height over the scale', () => {
    expect(
      resolveTypography({ variant: 'body', lineHeight: 12 }).lineHeight,
    ).toBe(12);
  });

  it('applies the variant preset', () => {
    expect(resolveTypography({ variant: 'heading' })).toMatchObject({
      fontFamily: 'IBMPlexMono_700Bold',
      fontSize: FONT_SIZE['3xl'],
      lineHeight: LINE_HEIGHT.mono['3xl'],
    });
  });

  it('renders the eyebrow variant with tracking and uppercase', () => {
    const style = resolveTypography({ variant: 'eyebrow' });

    expect(style.fontFamily).toBe('IBMPlexMono_600SemiBold');
    expect(style.textTransform).toBe('uppercase');
    expect(style.letterSpacing).toBe(1);
  });

  it('gives the link variant the accent colour', () => {
    expect(resolveTypography({ variant: 'link' }).color).toBe(Colors.accent);
  });

  it('lets an override replace a preset axis', () => {
    expect(
      resolveTypography({ variant: 'link', letterSpacing: 2 }).letterSpacing,
    ).toBe(2);
  });
});
