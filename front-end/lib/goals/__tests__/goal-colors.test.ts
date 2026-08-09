import {
  getGoalHeatmapColor,
  GOAL_ABOVE_THRESHOLD_COLOR,
  GOAL_MET_COLOR,
} from '../goal-colors';

describe('getGoalHeatmapColor', () => {
  it('uses the above-threshold color when the target is exceeded', () => {
    expect(getGoalHeatmapColor(5, 3)).toBe(GOAL_ABOVE_THRESHOLD_COLOR);
  });

  it('uses the met color when the target is reached', () => {
    expect(getGoalHeatmapColor(3, 3)).toBe(GOAL_MET_COLOR);
  });

  it('uses a faint cell for no completions', () => {
    expect(getGoalHeatmapColor(0, 3)).toMatch(/rgba\(0, 115, 255, 0\.15\)/);
  });

  it('uses a scaled blue for weeks below the target', () => {
    const color = getGoalHeatmapColor(1, 4);
    expect(color).toMatch(/^rgba\(0, 115, 255,/);
  });
});
