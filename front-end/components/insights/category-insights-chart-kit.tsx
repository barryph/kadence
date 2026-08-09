import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type TextStyle,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/base/themed-text';
import {
  CHART_PLOT_LEFT_OFFSET,
  computeChartHorizontalLayout,
} from '@/lib/insights/chart-horizontal-layout';
import {
  filterCategorySeries,
  type CategoryWeeklySeries,
} from '@/lib/insights/category-weekly-unique-days';
import { formatWeekLabel } from '@/utils/date';

const CHART_HEIGHT = 260;
const AREA_FILL_OPACITY = 0.22;

interface CategoryInsightsChartKitProps {
  series: CategoryWeeklySeries[];
  weekStarts: string[];
  selectedCategoryIds: number[];
}

function hexToRgba(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : normalized.slice(0, 6);
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function buildChartConfig() {
  return {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#050711',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#0b1020',
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(245, 247, 251, ${opacity * 0.65})`,
    labelColor: (opacity = 1) => `rgba(245, 247, 251, ${opacity * 0.65})`,
    strokeWidth: 2,
    useShadowColorFromDataset: true,
    fillShadowGradientFromOpacity: AREA_FILL_OPACITY,
    fillShadowGradientToOpacity: 0,
    propsForBackgroundLines: {
      stroke: 'rgba(255,255,255,0.06)',
      strokeDasharray: '',
    },
    propsForDots: {
      r: '3',
      strokeWidth: '0',
    },
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'system-ui',
    } satisfies Partial<TextStyle>,
  };
}

function getVisibleMaxValue(series: CategoryWeeklySeries[]): number {
  let max = 0;
  for (const item of series) {
    for (const point of item.data) {
      if (point.value > max) {
        max = point.value;
      }
    }
  }
  return max;
}

function computeYAxisScale(maxValue: number) {
  const axisMax = Math.max(1, maxValue);
  // react-native-chart-kit only renders one Y label when segments === 1.
  // Use two segments for 0–1 scales so 0 and 1 align with bottom/top grid lines.
  const segments = axisMax; // === 1 ? 2 : axisMax;

  return { axisMax, segments };
}

function formatIntegerYLabel(value: string, axisMax: number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  // if (axisMax === 1) {
  //   const rounded = Math.round(numeric);
  //   if (Math.abs(numeric - rounded) > 0.001) {
  //     return '';
  //   }
  //   return String(rounded);
  // }

  return String(Math.round(numeric));
}

export default function CategoryInsightsChartKit({
  series,
  weekStarts,
  selectedCategoryIds,
}: CategoryInsightsChartKitProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const visibleSeries = useMemo(
    () => filterCategorySeries(series, selectedCategoryIds),
    [selectedCategoryIds, series],
  );

  const labels = useMemo(
    () => weekStarts.map((weekStart) => formatWeekLabel(weekStart)),
    [weekStarts],
  );

  const yAxisScale = useMemo(() => {
    return computeYAxisScale(getVisibleMaxValue(visibleSeries));
  }, [visibleSeries]);

  const pointCount = useMemo(() => {
    let count = 1;
    for (const item of visibleSeries) {
      if (item.data.length > count) {
        count = item.data.length;
      }
    }
    return count;
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

  const chartConfig = useMemo(() => buildChartConfig(), []);

  const chartLayout = useMemo(
    () => computeChartHorizontalLayout(chartWidth, pointCount),
    [chartWidth, pointCount],
  );

  const formatYLabel = useMemo(
    () => (value: string) => formatIntegerYLabel(value, yAxisScale.axisMax),
    [yAxisScale.axisMax],
  );

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  if (visibleSeries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <ThemedText size="small" style={styles.emptyText}>
          Select categories to compare, or add categories to begin tracking
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
          width={chartLayout.width}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          fromZero
          fromNumber={yAxisScale.axisMax}
          transparent
          bezier={false}
          withShadow
          withInnerLines
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines
          withVerticalLabels
          withHorizontalLabels
          segments={yAxisScale.segments}
          yAxisInterval={1}
          formatYLabel={formatYLabel}
          // Keep labels flush against the right side of the label gutter.
          yLabelsOffset={14}
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
  caption: {
    opacity: 0.55,
    marginBottom: 16,
    letterSpacing: 0.4,
  },
  emptyState: {
    minHeight: CHART_HEIGHT,
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
