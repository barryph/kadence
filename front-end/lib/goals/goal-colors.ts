import { Colors, withAlpha } from '@/constants/theme';
import { DEFAULT_ACTIVITY_COLOR } from '@/lib/insights/activity-weekly-unique-days';

/** Default activity blue — used below/at the weekly goal target. */
export const GOAL_BELOW_THRESHOLD_COLOR = DEFAULT_ACTIVITY_COLOR;
/** Complementary color for performance above the target (neutral valence). */
export const GOAL_ABOVE_THRESHOLD_COLOR = Colors.exceeded;

/**
 * Heatmap cell color for a week's performance relative to the goal target.
 * 0 -> faint, below target -> scaled blue, above target -> amber.
 */
export function getGoalHeatmapColor(count: number, target: number): string {
  if (count >= target) {
    return GOAL_ABOVE_THRESHOLD_COLOR;
  }
  if (count <= 0) {
    return withAlpha(Colors.accent, 0.15);
  }
  // If below threshold - set opacity to match progress %
  const ratio = Math.min(count / target, 1);
  return withAlpha(Colors.accent, 0.35 + ratio * 0.4);
}
