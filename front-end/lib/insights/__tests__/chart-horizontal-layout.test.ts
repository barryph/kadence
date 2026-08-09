import {
  CHART_END_SPACING,
  CHART_PLOT_LEFT_OFFSET,
  computeChartHorizontalLayout,
} from '@/lib/insights/chart-horizontal-layout';

describe('computeChartHorizontalLayout', () => {
  it('returns the container width when the chart has not been measured', () => {
    expect(computeChartHorizontalLayout(0, 8)).toEqual({
      width: 0,
      marginRight: 0,
    });
  });

  it('does not adjust single-point charts', () => {
    expect(computeChartHorizontalLayout(358, 1)).toEqual({
      width: 358,
      marginRight: 0,
    });
  });

  it('extends the width so the last point reaches the right boundary', () => {
    const chartWidth = 358;
    const pointCount = 8;
    const { width, marginRight } = computeChartHorizontalLayout(
      chartWidth,
      pointCount,
    );

    expect(marginRight).toBe(
      (chartWidth - CHART_PLOT_LEFT_OFFSET - pointCount * CHART_END_SPACING) /
        (pointCount - 1),
    );

    const lastPoint =
      CHART_PLOT_LEFT_OFFSET +
      ((pointCount - 1) * (width - CHART_PLOT_LEFT_OFFSET)) / pointCount;

    expect(lastPoint).toBeCloseTo(chartWidth - CHART_END_SPACING);
  });

  it('keeps the rendered SVG width equal to the container width', () => {
    const { width, marginRight } = computeChartHorizontalLayout(358, 8);
    expect(width - marginRight).toBe(358);
  });

  it('keeps the last point at the right boundary across screen sizes', () => {
    const pointCount = 8;

    for (const chartWidth of [300, 358, 400]) {
      const { width, marginRight } = computeChartHorizontalLayout(
        chartWidth,
        pointCount,
      );
      const lastPoint =
        CHART_PLOT_LEFT_OFFSET +
        ((pointCount - 1) * (width - CHART_PLOT_LEFT_OFFSET)) / pointCount;

      expect(lastPoint).toBeCloseTo(chartWidth - CHART_END_SPACING);
      expect(width - marginRight).toBe(chartWidth);
    }
  });

  it('clamps the compensation at zero for very dense series', () => {
    expect(computeChartHorizontalLayout(300, 100).marginRight).toBe(0);
    expect(computeChartHorizontalLayout(300, 100).width).toBe(300);
  });
});
