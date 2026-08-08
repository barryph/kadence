import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { LineChart as AreaChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/base/themed-text';
import {
  isCategoryVisible,
  type CategoryWeeklySeries,
} from '@/lib/insights/category-weekly-unique-days';
import { formatWeekLabel } from '@/utils/date';

const CHART_HEIGHT = 260;
const Y_AXIS_LABEL_WIDTH = 18;
const END_SPACING = 15;
const TOGGLE_ANIMATION_MS = 280;
const AREA_START_OPACITY = 0.75;
const AREA_END_OPACITY = 0.45;
const POINTER_RADIUS = 4;

interface CategoryInsightsChartProps {
  series: CategoryWeeklySeries[];
  weekStarts: string[];
  endDate: string;
  selectedCategoryIds: number[];
}

function extendSeriesToEndDate(
  series: CategoryWeeklySeries[],
  endDate: string,
): CategoryWeeklySeries[] {
  const lastWeekStart = series[0]?.data.at(-1)?.weekStart;
  if (!lastWeekStart || lastWeekStart === endDate) {
    return series;
  }

  return series.map((item) => {
    const lastPoint = item.data.at(-1);
    if (!lastPoint) {
      return item;
    }

    return {
      ...item,
      data: [...item.data, { weekStart: endDate, value: lastPoint.value }],
    };
  });
}

function applyColorOpacity(color: string, opacity: number): string {
  if (opacity >= 1) {
    return color;
  }

  if (opacity <= 0) {
    return 'transparent';
  }

  const hex = color.replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
        .split('')
        .map((channel) => channel + channel)
        .join('')
      : hex.slice(0, 6);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function useCategoryOpacities(
  series: CategoryWeeklySeries[],
  selectedCategoryIds: number[],
) {
  const animatedValues = useRef<Map<number, Animated.Value>>(new Map());
  const [opacities, setOpacities] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      series.map((item) => [
        item.categoryId,
        isCategoryVisible(item.categoryId, selectedCategoryIds) ? 1 : 0,
      ]),
    ),
  );

  useEffect(() => {
    const listenerCleanups: (() => void)[] = [];

    const animations = series.map((item) => {
      const targetOpacity = isCategoryVisible(
        item.categoryId,
        selectedCategoryIds,
      )
        ? 1
        : 0;
      let animatedValue = animatedValues.current.get(item.categoryId);

      if (!animatedValue) {
        animatedValue = new Animated.Value(targetOpacity);
        animatedValues.current.set(item.categoryId, animatedValue);
      }

      const listenerId = animatedValue.addListener(({ value }) => {
        setOpacities((current) => {
          if (current[item.categoryId] === value) {
            return current;
          }

          return { ...current, [item.categoryId]: value };
        });
      });
      listenerCleanups.push(() => animatedValue.removeListener(listenerId));

      return Animated.timing(animatedValue, {
        toValue: targetOpacity,
        duration: TOGGLE_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();

    return () => {
      listenerCleanups.forEach((cleanup) => cleanup());
    };
  }, [selectedCategoryIds, series]);

  return opacities;
}

export default function CategoryInsightsChart({
  series,
  weekStarts,
  endDate,
  selectedCategoryIds,
}: CategoryInsightsChartProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartSeries = useMemo(
    () => extendSeriesToEndDate(series, endDate),
    [endDate, series],
  );
  const categoryOpacities = useCategoryOpacities(
    chartSeries,
    selectedCategoryIds,
  );

  // Max Y axis height the max value + 2
  const yAxisMax = useMemo(() => {
    let max = 0;
    for (const item of chartSeries) {
      for (const point of item.data) {
        if (point.value > max) {
          max = point.value;
        }
      }
    }
    return max + 2;
  }, [chartSeries]);

  const yAxisLabelTexts = useMemo(
    () => Array.from({ length: yAxisMax + 1 }, (_, index) => String(index)),
    [yAxisMax],
  );

  const chartPlotWidth = useMemo(() => {
    if (chartWidth <= Y_AXIS_LABEL_WIDTH) {
      return 0;
    }

    return chartWidth - Y_AXIS_LABEL_WIDTH - END_SPACING;
  }, [chartWidth]);

  const baseDataSet = useMemo(() => {
    return chartSeries.map((item, seriesIndex) => ({
      data: item.data.map((point, index) => ({
        value: point.value,
        label: seriesIndex === 0 && formatWeekLabel(point.weekStart),
      })),
      color: item.color,
      thickness: 1,
      curved: false,
      hideDataPoints: true,
      areaChart: true,
      startFillColor: item.color,
      endFillColor: item.color,
      startOpacity: AREA_START_OPACITY,
      endOpacity: AREA_END_OPACITY,
    }));
  }, [chartSeries]);

  const { dataSet, primaryData } = useMemo(() => {
    const styledDataSet = baseDataSet.map((set, index) => {
      const opacity = categoryOpacities[chartSeries[index].categoryId] ?? 1;
      const color = chartSeries[index].color;

      return {
        ...set,
        color: applyColorOpacity(color, opacity),
        startFillColor: applyColorOpacity(color, opacity),
        endFillColor: applyColorOpacity(color, opacity),
        startOpacity: AREA_START_OPACITY * opacity,
        endOpacity: AREA_END_OPACITY * opacity,
        thickness: opacity > 0.01 ? 3 : 0,
        hidePointers: opacity <= 0.01,
      };
    });

    return {
      dataSet: styledDataSet,
      primaryData: baseDataSet[0]?.data ?? [],
    };
  }, [baseDataSet, categoryOpacities, chartSeries]);

  const plotLayout = useMemo(() => {
    const pointCount = primaryData.length;
    if (chartPlotWidth <= 0 || pointCount <= 1) {
      return {
        spacing: 0,
        initialSpacing: 0,
        plotLineLength: chartPlotWidth,
      };
    }

    // gifted-charts applies initialSpacing as ScrollView padding *and* in getX().
    // Keep it at 0 so pointer x coords match the plotted line coords.
    const initialSpacing = 0;
    const spacing = chartPlotWidth / (pointCount - 1);
    const plotLineLength = spacing * (pointCount - 1);

    return { spacing, initialSpacing, plotLineLength };
  }, [chartPlotWidth, primaryData.length]);

  const pointerConfig = useMemo(() => {
    const pointerColorsForDataSet = chartSeries.map((item) => {
      const opacity = categoryOpacities[item.categoryId] ?? 1;
      return applyColorOpacity(item.color, opacity);
    });

    return {
      activatePointersInstantlyOnTouch: true,
      pointerStripUptoDataPoint: true,
      showPointerStrip: true,
      pointerStripColor: 'rgba(255,255,255,0.12)',
      pointerStripWidth: 1,
      radius: POINTER_RADIUS,
      pointerColorsForDataSet,
      autoAdjustPointerLabelPosition: true,
      pointerLabelWidth: 100,
      pointerLabelHeight: CHART_HEIGHT,
      resetPointerIndexOnRelease: true,
      pointerLabelComponent: (
        items: { value?: number }[],
        _secondaryItems: unknown,
        pointerIndex: number,
      ) => {
        const weekLabel = primaryData[pointerIndex]?.label;
        if (!weekLabel) {
          return null;
        }

        const rows = chartSeries
          .map((item, seriesIndex) => ({
            categoryId: item.categoryId,
            name: item.name,
            color: item.color,
            opacity: categoryOpacities[item.categoryId] ?? 1,
            value: items[seriesIndex]?.value ?? 0,
          }))
          .filter((row) => row.opacity > 0.01);

        if (rows.length === 0) {
          return null;
        }

        return (
          <View style={styles.tooltip}>
            <Text size="extraSmall" style={styles.tooltipHeading}>
              {weekLabel}
            </Text>
            {rows.map((row) => (
              <View key={row.categoryId} style={styles.tooltipRow}>
                <View
                  style={[styles.tooltipDot, { backgroundColor: row.color }]}
                />
                <Text size="extraSmall" style={styles.tooltipText}>
                  {row.name}: {row.value}
                </Text>
              </View>
            ))}
          </View>
        );
      },
    };
  }, [categoryOpacities, chartSeries, primaryData]);

  function handleLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  if (chartSeries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text size="small" style={styles.emptyText}>
          Select categories to compare, or add categories to begin tracking
          insights.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <ThemedText size="extraSmall" style={styles.caption}>
        Number of days completed per week
      </ThemedText>
      {chartPlotWidth > 0 ? (
        <AreaChart
          areaChart
          animateTogether
          disableScroll
          data={primaryData}
          dataSet={dataSet}
          height={CHART_HEIGHT}
          parentWidth={chartWidth}
          spacing={plotLayout.spacing}
          initialSpacing={plotLayout.initialSpacing}
          rulesLength={plotLayout.plotLineLength}
          xAxisLength={plotLayout.plotLineLength}
          maxValue={yAxisMax}
          noOfSections={yAxisMax}
          stepValue={1}
          isAnimated
          animationDuration={400}
          yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
          yAxisLabelTexts={yAxisLabelTexts}
          yAxisColor="rgba(255,255,255,0.00)"
          xAxisColor="rgba(255,255,255,0.00)"
          rulesColor="rgba(255,255,255,0.05)"
          rulesType="solid"
          yAxisLabelContainerStyle={{
            justifyContent: 'flex-start',
          }}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          color="rgba(255,255,255,0.4)"
          hideRules={false}
          pointerConfig={pointerConfig}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'visible',
  },
  caption: {
    opacity: 0.55,
    marginBottom: 16,
    letterSpacing: 0.4,
  },
  axisText: {
    color: 'rgba(245, 247, 251, 0.65)',
    fontSize: 10,
    fontFamily: '"system-ui"',
  },
  tooltip: {
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 12, 16, 0.94)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tooltipHeading: {
    color: 'rgba(245, 247, 251, 0.65)',
    marginBottom: 2,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipText: {
    color: 'rgba(245, 247, 251, 0.9)',
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
