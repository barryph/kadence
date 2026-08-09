import type { CartesianChartTheme } from 'react-native-chart-kit/v2';

export const INSIGHTS_CHART_HEIGHT = 260;
export const INSIGHTS_AREA_FILL_OPACITY = 0.22;

export function buildInsightsChartTheme(): CartesianChartTheme {
  return {
    background: 'transparent',
    plotBackground: 'transparent',
    grid: 'rgba(255,255,255,0.06)',
    text: 'rgba(245,247,251,0.65)',
    mutedText: 'rgba(245,247,251,0.65)',
    typography: {
      axisLabelSize: 10,
      fontFamily: 'system-ui',
    },
  };
}

export function formatIntegerYLabel(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return String(Math.round(value));
}
