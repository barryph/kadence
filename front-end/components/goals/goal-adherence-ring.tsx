import { StyleSheet, View } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/base/themed-text';
import { buildInsightsChartConfig } from '@/components/insights/insights-chart-kit-config';
import { GOAL_BELOW_THRESHOLD_COLOR } from '@/lib/goals/goal-colors';
import type { IGoalAdherence } from '@/api/api.goals';

const RING_SIZE = 132;
const RING_STROKE_WIDTH = 12;

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
  const chartConfig = buildInsightsChartConfig();

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
          chartConfig={chartConfig}
          withCustomBarColorFromData
          hideLegend
        />
        <View style={styles.center}>
          <ThemedText type="defaultBold" size="large" style={styles.percent}>
            {percentage === null ? '—' : `${percentage}%`}
          </ThemedText>
        </View>
      </View>
      <ThemedText size="small" style={styles.caption}>
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
    color: '#fff',
  },
  caption: {
    opacity: 0.65,
    marginTop: 6,
    textAlign: 'center',
  },
});
