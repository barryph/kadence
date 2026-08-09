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
  CHART_PLOT_LEFT_OFFSET,
  computeChartHorizontalLayout,
} from '@/lib/insights/chart-horizontal-layout';
import { formatWeekLabel } from '@/utils/date';

export interface InsightsLineSeries {
  color: string;
  data: { weekStart: string; value: number }[];
}

interface InsightsLineChartKitProps {
  series: InsightsLineSeries[];
  weekStarts: string[];
  emptyMessage?: string;
}

const yAxisScale = {
  maxValue: 7,
  noOfSections: 7,
  stepValue: 1,
};

export default function InsightsLineChartKit({
  series,
  weekStarts,
  emptyMessage = 'Select items to compare, or add items to begin tracking insights.',
}: InsightsLineChartKitProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const labels = useMemo(() => weekStarts.map(formatWeekLabel), [weekStarts]);

  const chartData = useMemo(
    () => ({
      labels,
      datasets: series.map((item) => ({
        data: item.data.map((point) => point.value),
        color: (opacity = 1) => hexToRgba(item.color, opacity),
        strokeWidth: 2,
        withDots: true,
      })),
    }),
    [labels, series],
  );

  const chartConfig = useMemo(() => buildInsightsChartConfig(), []);

  const chartLayout = useMemo(
    () => computeChartHorizontalLayout(chartWidth, labels.length),
    [chartWidth, labels.length],
  );

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  if (series.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText size="small" style={styles.emptyText}>
          {emptyMessage}
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
