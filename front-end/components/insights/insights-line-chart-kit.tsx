import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit/v2';
import { ThemedText } from '@/components/base/themed-text';
import {
  buildInsightsChartTheme,
  formatIntegerYLabel,
  INSIGHTS_AREA_FILL_OPACITY,
  INSIGHTS_CHART_HEIGHT,
} from '@/components/insights/insights-chart-kit-config';
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

const Y_AXIS_MAX_VALUE = 7;

type ComparisonRow = Record<string, string | number>;

export default function InsightsLineChartKit({
  series,
  weekStarts,
  emptyMessage = 'Select items to compare, or add items to begin tracking insights.',
}: InsightsLineChartKitProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const rows = useMemo<ComparisonRow[]>(() => {
    const valuesBySeries = series.map(
      (item) =>
        new Map(item.data.map((point) => [point.weekStart, point.value])),
    );
    return weekStarts.map((weekStart, weekIndex) => {
      const row: ComparisonRow = { week: formatWeekLabel(weekStart) };
      valuesBySeries.forEach((values, seriesIndex) => {
        row[`s${seriesIndex}`] = values.get(weekStart) ?? 0;
      });
      return row;
    });
  }, [series, weekStarts]);

  const chartSeries = useMemo(
    () =>
      series.map((item, index) => ({
        yKey: `s${index}`,
        color: item.color,
        strokeWidth: 2,
        area: true,
        dot: true,
      })),
    [series],
  );

  const theme = useMemo(() => buildInsightsChartTheme(), []);

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
          data={rows}
          xKey="week"
          series={chartSeries}
          width={chartWidth}
          height={INSIGHTS_CHART_HEIGHT}
          theme={theme}
          curve="linear"
          yDomain={{ min: 0, max: Y_AXIS_MAX_VALUE }}
          areaFill={{
            fromOpacity: INSIGHTS_AREA_FILL_OPACITY,
            toOpacity: 0,
          }}
          showHorizontalGridLines
          formatYLabel={formatIntegerYLabel}
          labelStrategy="show"
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
