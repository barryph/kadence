import {
  computeInsightsYAxisScale,
  getSeriesDataMax,
} from '@/lib/insights/chart-y-axis-scale';

describe('computeInsightsYAxisScale', () => {
  it('uses a 0-1 axis when the visible max is 1', () => {
    expect(computeInsightsYAxisScale(1)).toEqual({
      maxValue: 1,
      noOfSections: 1,
      stepValue: 1,
    });
  });

  it('uses a 0-1 axis when there is no activity', () => {
    expect(computeInsightsYAxisScale(0)).toEqual({
      maxValue: 1,
      noOfSections: 1,
      stepValue: 1,
    });
  });

  it('adds headroom for larger maxima while capping at 7', () => {
    expect(computeInsightsYAxisScale(3)).toEqual({
      maxValue: 5,
      noOfSections: 5,
      stepValue: 1,
    });
    expect(computeInsightsYAxisScale(6)).toEqual({
      maxValue: 7,
      noOfSections: 7,
      stepValue: 1,
    });
  });
});

describe('getSeriesDataMax', () => {
  it('returns the highest value in the list', () => {
    expect(getSeriesDataMax([0, 1, 3, 2])).toBe(3);
  });

  it('returns 0 for an empty list', () => {
    expect(getSeriesDataMax([])).toBe(0);
  });
});
