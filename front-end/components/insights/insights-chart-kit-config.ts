import type { TextStyle } from 'react-native';

export const INSIGHTS_CHART_HEIGHT = 260;
export const INSIGHTS_AREA_FILL_OPACITY = 0.22;

export function hexToRgba(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
        .split('')
        .map((channel) => channel + channel)
        .join('')
      : normalized.slice(0, 6);
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function buildInsightsChartConfig() {
  return {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#050711',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#0b1020',
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(245, 247, 251, ${opacity * 0.65})`,
    labelColor: (opacity = 1) => `rgba(245, 247, 251, ${opacity * 0.65})`,
    strokeWidth: 2,
    useShadowColorFromDataset: true,
    fillShadowGradientFromOpacity: INSIGHTS_AREA_FILL_OPACITY,
    fillShadowGradientToOpacity: 0,
    propsForBackgroundLines: {
      stroke: 'rgba(255,255,255,0.06)',
      strokeDasharray: '',
    },
    propsForDots: {
      r: '3',
      strokeWidth: '0',
    },
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'system-ui',
    } satisfies Partial<TextStyle>,
  };
}

export function formatIntegerYLabel(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return String(Math.round(numeric));
}
