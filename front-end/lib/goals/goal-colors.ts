import { DEFAULT_ACTIVITY_COLOR } from '@/lib/insights/activity-weekly-unique-days';

/** Default activity blue — used below/at the weekly goal target. */
export const GOAL_BELOW_THRESHOLD_COLOR = DEFAULT_ACTIVITY_COLOR;
/** Complementary color for performance above the target (neutral valence). */
export const GOAL_ABOVE_THRESHOLD_COLOR = '#ff9f43';
/** Used when a goal was met exactly on target. */
export const GOAL_MET_COLOR = '#08d8ff';

const BLUE_RGB = '0, 115, 255';

function blueAtOpacity(opacity: number): string {
  return `rgba(${BLUE_RGB}, ${opacity})`;
}

/**
 * Heatmap cell color for a week's performance relative to the goal target.
 * 0 -> faint, below target -> scaled blue, at target -> met cyan,
 * above target -> amber.
 */
export function getGoalHeatmapColor(count: number, target: number): string {
  if (count >= target) {
    return count > target ? GOAL_ABOVE_THRESHOLD_COLOR : GOAL_MET_COLOR;
  }
  if (count <= 0) {
    return blueAtOpacity(0.15);
  }
  const ratio = Math.min(count / target, 1);
  return blueAtOpacity(0.35 + ratio * 0.4);
}
