export interface InsightsYAxisScale {
  maxValue: number;
  noOfSections: number;
  stepValue: number;
}

/**
 * Builds Y-axis bounds for category insights charts.
 * Uses integer steps from 0. When the visible max is 1, the axis tops out at 1
 * so the "1" label aligns with the value-1 grid line (not padded to 3).
 */
export function computeInsightsYAxisScale(dataMax: number): InsightsYAxisScale {
  const clampedMax = Math.max(0, dataMax);

  if (clampedMax <= 1) {
    return {
      maxValue: 1,
      noOfSections: 1,
      stepValue: 1,
    };
  }

  const maxValue = Math.min(7, clampedMax + 2);

  return {
    maxValue,
    noOfSections: maxValue,
    stepValue: 1,
  };
}

export function getSeriesDataMax(values: number[]): number {
  let max = 0;
  for (const value of values) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}
