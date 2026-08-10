import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import type { IGoalWeeklyPoint } from '@/api/api.goals';
import {
  getGoalHeatmapColor,
  GOAL_ABOVE_THRESHOLD_COLOR,
  GOAL_BELOW_THRESHOLD_COLOR,
} from '@/lib/goals/goal-colors';

const CELL_SIZE = 18;
const CELL_GAP = 5;

interface GoalHeatmapProps {
  data: IGoalWeeklyPoint[];
  targetPerWeek: number;
}

export default function GoalHeatmap({ data, targetPerWeek }: GoalHeatmapProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText size="small" style={styles.emptyText}>
          No completion history yet. Weeks will appear here once this activity
          has been completed.
        </ThemedText>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.grid}>
        {data.map((week) => (
          <View
            key={week.weekStart}
            accessibilityLabel={`Week of ${week.weekStart}: ${week.count} completions`}
            style={[
              styles.cell,
              {
                backgroundColor: getGoalHeatmapColor(week.count, targetPerWeek),
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        <LegendDot color="rgba(0, 115, 255, 0.15)" label="None" />
        <LegendDot color={GOAL_BELOW_THRESHOLD_COLOR} label="Below" />
        <LegendDot color={GOAL_ABOVE_THRESHOLD_COLOR} label="Above" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText size="extraSmall" style={styles.legendText}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    opacity: 0.7,
  },
  emptyState: {
    paddingVertical: 16,
  },
  emptyText: {
    opacity: 0.65,
    lineHeight: 18,
  },
});
