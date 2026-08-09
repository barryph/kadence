import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Line } from 'react-native-svg';
import { ThemedText } from '@/components/base/themed-text';
import {
  buildInsightsChartConfig,
  formatIntegerYLabel,
  INSIGHTS_CHART_HEIGHT,
} from '@/components/insights/insights-chart-kit-config';
import {
  CHART_PLOT_LEFT_OFFSET,
  computeChartHorizontalLayout,
} from '@/lib/insights/chart-horizontal-layout';
import {
  GOAL_ABOVE_THRESHOLD_COLOR,
  GOAL_BELOW_THRESHOLD_COLOR,
} from '@/lib/goals/goal-colors';
import { formatWeekLabel } from '@/utils/date';

export interface GoalWeeklyPoint {
  weekStart: string;
  count: number;
}

interface GoalAreaChartProps {
  /** Applicable weeks only (>= the activity's first completion week). */
  data: GoalWeeklyPoint[];
  targetPerWeek: number;
}

const yAxisScale = {
  maxValue: 7,
  noOfSections: 7,
  stepValue: 1,
};

/**
 * 8-week threshold area chart.
 * Two layered datasets produce a stacked area: the blue region spans from 0 to
 * the target and the amber region spans from the target up to the actual count.
 * A dashed threshold line is drawn at the target level via the chart's
 * `decorator`, which runs after the area shadows.
 */
export default function GoalAreaChart({
  data,
  targetPerWeek,
}: GoalAreaChartProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const labels = useMemo(
    () => data.map((point) => formatWeekLabel(point.weekStart)),
    [data],
  );

  const chartData = useMemo(() => {
    const full = data.map((point) => point.count);
    const clamped = data.map((point) => Math.min(point.count, targetPerWeek));
    return {
      labels,
      datasets: [
        {
          data: full,
          color: () => GOAL_ABOVE_THRESHOLD_COLOR,
          strokeWidth: 2,
          withDots: true,
        },
        {
          data: clamped,
          color: () => GOAL_BELOW_THRESHOLD_COLOR,
          strokeWidth: 0,
          withDots: false,
        },
      ],
    };
  }, [data, labels, targetPerWeek]);

  const chartConfig = useMemo(() => buildInsightsChartConfig(), []);

  const chartLayout = useMemo(
    () => computeChartHorizontalLayout(chartWidth, labels.length),
    [chartWidth, labels.length],
  );

  const thresholdDecorator = useMemo(
    // eslint-disable-next-line react/display-name -- render callback, not a component
    () => (config: Record<string, number>) => {
      const paddingTop = config.paddingTop ?? 16;
      const y =
        paddingTop +
        ((config.height * 3) / 4) * (1 - targetPerWeek / yAxisScale.maxValue);
      return (
        <Line
          x1={config.paddingRight ?? 0}
          y1={y}
          x2={config.width}
          y2={y}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
          strokeDasharray="6 5"
        />
      );
    },
    [targetPerWeek],
  );

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText size="small" style={styles.emptyText}>
          No completion history yet. Complete this activity to see weekly
          performance here.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {chartWidth > 0 ? (
        <LineChart
          data={chartData}
          width={chartLayout.width}
          height={INSIGHTS_CHART_HEIGHT}
          chartConfig={chartConfig}
          fromZero
          fromNumber={yAxisScale.maxValue}
          transparent
          bezier={false}
          withShadow
          withInnerLines
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines
          withVerticalLabels
          withHorizontalLabels
          segments={yAxisScale.noOfSections}
          yAxisInterval={1}
          formatYLabel={formatIntegerYLabel}
          decorator={thresholdDecorator}
          style={{
            borderRadius: 0,
            marginRight: chartLayout.marginRight,
            paddingRight: CHART_PLOT_LEFT_OFFSET,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  emptyState: {
    minHeight: INSIGHTS_CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    opacity: 0.65,
    textAlign: 'center',
    lineHeight: 18,
  },
});
