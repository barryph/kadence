/**
 * react-native-chart-kit's LineChart positions the last data point one
 * point-spacing short of the right edge: it divides the plot width by the
 * point count rather than the count minus one, while the horizontal grid
 * lines still run all the way to the chart's `width`. The result is a
 * trailing gap where the grid visibly extends past the plotted line.
 *
 * The library trims the rendered SVG width by `style.marginRight`, so the
 * fix is to widen the chart by that amount and let the grid be clipped at
 * the same right boundary as the last data point. The last point then lands
 * at `chartWidth - CHART_END_SPACING`, which keeps the first and last points
 * (and their axis labels) clear of the container edges.
 */

export const CHART_PLOT_LEFT_OFFSET = 64;
export const CHART_END_SPACING = 4;

export interface ChartHorizontalLayout {
  width: number;
  marginRight: number;
}

export function computeChartHorizontalLayout(
  chartWidth: number,
  pointCount: number,
): ChartHorizontalLayout {
  if (chartWidth <= 0 || pointCount <= 1) {
    return { width: chartWidth, marginRight: 0 };
  }

  // The library places the last point at:
  //   lastPoint = PLOT_LEFT + (pointCount - 1) * (width - PLOT_LEFT) / pointCount
  // Solve for `marginRight` so that lastPoint === chartWidth - CHART_END_SPACING.
  const compensation =
    (chartWidth - CHART_PLOT_LEFT_OFFSET - pointCount * CHART_END_SPACING) /
    (pointCount - 1);
  const marginRight = Math.max(0, compensation);

  return {
    width: chartWidth + marginRight,
    marginRight,
  };
}
