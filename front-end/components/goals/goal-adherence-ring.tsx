import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit/v2';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, withAlpha } from '@/constants/theme';
import { buildInsightsChartTheme } from '@/components/insights/insights-chart-kit-config';
import { GOAL_BELOW_THRESHOLD_COLOR } from '@/lib/goals/goal-colors';
import type { IGoalAdherence } from '@/api/api.goals';

const RING_SIZE = 132;
const RING_STROKE_WIDTH = 12;

const RING_BACKGROUND_COLOR = withAlpha(Colors.textPrimary, 0.13);

interface GoalAdherenceRingProps {
  adherence: IGoalAdherence;
  periodLabel: string;
}

export default function GoalAdherenceRing({
  adherence,
  periodLabel,
}: GoalAdherenceRingProps) {
  const percentage =
    adherence.percentage === null
      ? null
      : Math.round(adherence.percentage * 100);
  const theme = useMemo(
    () => ({
      ...buildInsightsChartTheme(),
      grid: RING_BACKGROUND_COLOR,
    }),
    [],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.ringContainer}>
        <ProgressChart
          data={{
            data: [adherence.percentage ?? 0],
            colors: [GOAL_BELOW_THRESHOLD_COLOR],
          }}
          width={RING_SIZE}
          height={RING_SIZE}
          strokeWidth={RING_STROKE_WIDTH}
          radius={(RING_SIZE - RING_STROKE_WIDTH) / 2}
          theme={theme}
          hideLegend
        />
        <View style={styles.center}>
          <ThemedText variant="title" style={styles.percent}>
            {percentage === null ? '—' : `${percentage}%`}
          </ThemedText>
        </View>
      </View>
      <ThemedText variant="bodySmall" style={styles.caption}>
        Adherence · {periodLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    color: Colors.textPrimary,
  },
  caption: {
    opacity: 0.65,
    marginTop: 6,
    textAlign: 'center',
  },
});
