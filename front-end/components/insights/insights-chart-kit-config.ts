import type { CartesianChartTheme } from 'react-native-chart-kit/v2';

import { Colors } from '@/constants/theme';
import { SYSTEM_FONT_FAMILY } from '@/constants/typography';

export const INSIGHTS_CHART_HEIGHT = 260;
export const INSIGHTS_AREA_FILL_OPACITY = 0.22;

export function buildInsightsChartTheme(): CartesianChartTheme {
  return {
    background: 'transparent',
    plotBackground: 'transparent',
    grid: Colors.borderFaint,
    text: Colors.textFaint,
    mutedText: Colors.textFaint,
    typography: {
      axisLabelSize: 10,
      fontFamily: SYSTEM_FONT_FAMILY,
    },
  };
}

export function formatIntegerYLabel(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  return String(Math.round(value));
}
