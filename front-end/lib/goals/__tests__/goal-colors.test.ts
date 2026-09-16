import { Colors, withAlpha } from '@/constants/theme';
import {
  getGoalHeatmapColor,
  GOAL_ABOVE_THRESHOLD_COLOR,
} from '../goal-colors';

describe('getGoalHeatmapColor', () => {
  it('uses the above-threshold color when the target is exceeded', () => {
    expect(getGoalHeatmapColor(5, 3)).toBe(GOAL_ABOVE_THRESHOLD_COLOR);
  });

  it('uses the above-threshold color when the target is reached', () => {
    expect(getGoalHeatmapColor(3, 3)).toBe(GOAL_ABOVE_THRESHOLD_COLOR);
  });

  it('uses a faint accent cell for no completions', () => {
    expect(getGoalHeatmapColor(0, 3)).toBe(withAlpha(Colors.accent, 0.15));
  });

  it('uses a scaled accent for weeks below the target', () => {
    const accentPrefix = withAlpha(Colors.accent, 0).replace('0)', '');
    expect(getGoalHeatmapColor(1, 4).startsWith(accentPrefix)).toBe(true);
  });
});
