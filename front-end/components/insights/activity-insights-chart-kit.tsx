import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/base/themed-text';
import {
  buildInsightsChartConfig,
  formatIntegerYLabel,
  hexToRgba,
  INSIGHTS_CHART_HEIGHT,
} from '@/components/insights/insights-chart-kit-config';
import {
  filterActivitySeries,
  type ActivityWeeklySeries,
} from '@/lib/insights/activity-weekly-unique-days';
import {
  computeInsightsYAxisScale,
  getSeriesDataMax,
} from '@/lib/insights/chart-y-axis-scale';
import { formatWeekLabel } from '@/utils/date';

interface ActivityInsightsChartKitProps {
  series: ActivityWeeklySeries[];
  weekStarts: string[];
  selectedActivityIds: number[];
}

export default function ActivityInsightsChartKit({
  series,
  weekStarts,
  selectedActivityIds,
}: ActivityInsightsChartKitProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const visibleSeries = useMemo(
    () => filterActivitySeries(series, selectedActivityIds),
    [selectedActivityIds, series],
  );

  const labels = useMemo(
    () => weekStarts.map((weekStart) => formatWeekLabel(weekStart)),
    [weekStarts],
  );

  const yAxisScale = useMemo(() => {
    const values: number[] = [];
    for (const item of visibleSeries) {
      for (const point of item.data) {
        values.push(point.value);
      }
    }
    return computeInsightsYAxisScale(getSeriesDataMax(values));
  }, [visibleSeries]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: visibleSeries.map((item) => ({
        data: item.data.map((point) => point.value),
        color: (opacity = 1) => hexToRgba(item.color, opacity),
        strokeWidth: 2,
        withDots: true,
      })),
    }),
    [labels, visibleSeries],
  );

  const chartConfig = useMemo(() => buildInsightsChartConfig(), []);

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  if (visibleSeries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText size="small" style={styles.emptyText}>
          Select activities to compare, or add activities to begin tracking
          insights.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <ThemedText size="extraSmall" style={styles.caption}>
        Number of days completed per week
      </ThemedText>
      {chartWidth > 0 ? (
        <LineChart
          data={chartData}
          width={chartWidth}
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
          yAxisInterval={yAxisScale.stepValue}
          formatYLabel={formatIntegerYLabel}
          style={styles.chart}
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
  caption: {
    opacity: 0.55,
    marginBottom: 16,
    letterSpacing: 0.4,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 0,
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
