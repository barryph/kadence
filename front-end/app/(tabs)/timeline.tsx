import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { type ITimelineSet } from '@/api/api.timeline';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import AntDesign from '@expo/vector-icons/AntDesign';

import Background from '@/components/backgrounds/background';
import Center from '@/components/ui/center';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Shadows, Spacing, withAlpha } from '@/constants/theme';
import FilterList from '@/components/filter-list/filter-list';
import {
  filterByCategoryId,
  toggleSingleSelectFilter,
} from '@/components/filter-list/filter-by-category';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import {
  useCompleteActivityMutation,
  useUndoActivityMutation,
} from '@/hooks/mutations/use-activity-mutations';
import { ApiError } from '@/lib/query/unwrap';
import { getMonthDates, getMonthOf, toLocalDate } from '@/utils/date';
import { useToday } from '@/hooks/use-today';

const CELL_WIDTH = 20;
const CELL_HEIGHT = 20;
const CELL_GAP = 8;
const ROW_CONTENT_SIZE = 25;
const ROW_HEIGHT = ROW_CONTENT_SIZE + CELL_GAP * 2;
const HEADER_ROW_EXTRA_HEIGHT = 4;
const LEFT_COLUMN_WIDTH = 80; // To allow the ticker text to show
// const HEADERS_BACKGROUND = Colors.surfaceHeader;
const HEADERS_BACKGROUND = undefined;

type TimelineDateColumn = {
  full: string;
  day: string;
  weekday: string;
};

/**
 * Builds the display labels for one calendar date.
 *
 * `full` is the opaque `YYYY-MM-DD` key the API uses; it is never re-derived
 * from the formatted output, so no timezone or locale can shift it. The labels
 * are built from a device-local midnight for that same calendar date, which is
 * a display-only conversion (see `toLocalDate`).
 */
function toTimelineDateColumn(dateStr: string): TimelineDateColumn {
  const date = toLocalDate(dateStr);
  return {
    full: dateStr,
    day: date
      .toLocaleDateString(undefined, {
        day: 'numeric',
      })
      .split(' ')
      .reverse()
      .join('\n')
      .padStart(2, '0'),
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
  };
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * One column per calendar day of `month`, never past the user's `today`.
 *
 * The day list comes from `getMonthDates`, which walks UTC day numbers, so the
 * columns cannot skip or repeat a date across a DST transition and cannot
 * disagree with the `YYYY-MM-DD` keys the API returns.
 */
function buildMonthDateColumns(
  month: string,
  today: string,
): TimelineDateColumn[] {
  return getMonthDates(month, today).map(toTimelineDateColumn);
}

function TimelineScreen() {
  const {
    data: activities,
    isPending: isActivitiesPending,
    isError: isActivitiesError,
  } = useActivitiesQuery();
  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useCategoriesQuery();

  // The user's local date, so the month the grid opens on, the "no future
  // dates" cap and the completion keys all follow their calendar.
  const today = useToday();
  const currentMonth = getMonthOf(today);
  const [monthInView, setMonthInView] = useState<string>(currentMonth);
  const timelineQuery = useTimelineQuery(monthInView);
  const completeActivity = useCompleteActivityMutation();
  const undoActivity = useUndoActivityMutation();

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const dateColumns = useMemo(
    () => buildMonthDateColumns(monthInView, today),
    [monthInView, today],
  );
  const initError =
    isActivitiesError || isCategoriesError || timelineQuery.isError
      ? 'Unable to load timeline. Please try again.'
      : undefined;
  const [loadMoreError, setLoadMoreError] = useState<string | undefined>(
    undefined,
  );
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());
  const [toggleError, setToggleError] = useState<string | undefined>(undefined);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const viewportWidthRef = useRef(0);
  const contentWidthRef = useRef(0);
  const hasPositionedInitialScroll = useRef(false);
  // Month nav: position under the overlay before revealing to avoid a jump
  const pendingMonthScrollRef = useRef<'start' | 'end' | null>(null);
  const [isInitialScrollReady, setIsInitialScrollReady] = useState(false);

  /***
   * Scrolling — declared early so initial positioning can sync the sticky header
   */
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const columnHeaderRef = useAnimatedRef();
  const rowHeaderRef = useAnimatedRef();

  function scrollTimelineTo(x: number, animated = true) {
    scrollX.value = x;
    scrollViewRef.current?.scrollTo({ x, y: 0, animated });
  }

  /**
   * Set scroll position to the current day on first load
   * Today is always the last column — scroll to the end before revealing
   */
  function scrollToEndAndReveal() {
    if (hasPositionedInitialScroll.current) return;
    if (contentWidthRef.current <= 0 || viewportWidthRef.current <= 0) return;

    hasPositionedInitialScroll.current = true;
    scrollTimelineTo(
      Math.max(0, contentWidthRef.current - viewportWidthRef.current),
      false,
    );
    requestAnimationFrame(() => {
      setIsInitialScrollReady(true);
    });
  }

  /**
   * Scroll the the start/end of the month when navigating back and forth
   *
   * Apply pending month-nav scroll once layout metrics are ready.
   * Keeps the loading overlay up until positioned to avoid a visible jump.
   */
  function finalizePendingMonthScroll() {
    const target = pendingMonthScrollRef.current;
    if (!target) return false;
    if (contentWidthRef.current <= 0 || viewportWidthRef.current <= 0) {
      return false;
    }

    const x =
      target === 'end'
        ? Math.max(0, contentWidthRef.current - viewportWidthRef.current)
        : 0;

    scrollTimelineTo(x);
    pendingMonthScrollRef.current = null;
    requestAnimationFrame(() => {
      setIsLoadingTimeline(false);
    });
    return true;
  }

  /***
   * Month navigation
   */
  function getNextMonthToLoad(
    month: string,
    direction: 'PREV' | 'NEXT',
  ): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthShift = direction === 'PREV' ? -1 : 1;
    const nextMonthToLoad = new Date(year, monthNumber + monthShift - 1, 1);
    return formatMonthKey(nextMonthToLoad);
  }

  /***
   * Fetch more data
   */
  function fetchMonth(currentMonth: string, direction: 'PREV' | 'NEXT') {
    const month = getNextMonthToLoad(currentMonth, direction);
    setLoadMoreError(undefined);
    setIsLoadingTimeline(true);
    requestAnimationFrame(() => {
      pendingMonthScrollRef.current = direction === 'PREV' ? 'end' : 'start';
      setMonthInView(month);
    });
  }

  useEffect(() => {
    if (!isLoadingTimeline) return;

    if (timelineQuery.isError) {
      pendingMonthScrollRef.current = null;
      setLoadMoreError('Unable to load more timeline. Please try again.');
      setIsLoadingTimeline(false);
      return;
    }

    if (!timelineQuery.isFetching && timelineQuery.data) {
      finalizePendingMonthScroll();
    }
  }, [
    isLoadingTimeline,
    timelineQuery.isError,
    timelineQuery.isFetching,
    timelineQuery.data,
  ]);

  // Fallback when onContentSizeChange doesn't fire (same-width months).
  // Prefer the content-size callback so we don't finalize with a stale width.
  useEffect(() => {
    if (!pendingMonthScrollRef.current) return;

    const timeoutId = setTimeout(() => {
      finalizePendingMonthScroll();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [monthInView, dateColumns]);

  /***
   * Toggle cells
   */
  async function handleCellClick(
    cellKey: string,
    activityId: number,
    dateKey: string,
    isCompleted: boolean,
  ) {
    if (togglingCells.has(cellKey)) return;

    try {
      setToggleError(undefined);
      setTogglingCells((prev) => {
        const next = new Set(prev);
        next.add(cellKey);
        return next;
      });
      const isCompleting = !isCompleted;

      if (isCompleting) {
        await completeActivity.mutateAsync({ activityId, date: dateKey });
      } else {
        await undoActivity.mutateAsync({ activityId, date: dateKey });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setToggleError(err.message);
      } else {
        setToggleError('Unable to update activity status. Please try again.');
      }
      console.error('Error updating timeline activity status', err);
    } finally {
      setTogglingCells((prev) => {
        const newValue = new Set(prev);
        newValue.delete(cellKey);
        return newValue;
      });
    }
  }

  /***
   * Scrolling handlers
   */
  // Runs on the UI thread
  const scrollHandlerX = useAnimatedScrollHandler({
    onScroll: (event: ReanimatedScrollEvent) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  const scrollHandlerY = useAnimatedScrollHandler({
    onScroll: (event: ReanimatedScrollEvent) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Sync the "scroll" position of the headers with the body
  useDerivedValue(() => {
    scrollTo(columnHeaderRef, scrollX.value, 0, false);
  });
  useDerivedValue(() => {
    scrollTo(rowHeaderRef, 0, scrollY.value, false);
  });

  /***
   * Rendering
   */

  const tableData: ITimelineSet | undefined = timelineQuery.data;
  const filteredActivities = activities
    ? filterByCategoryId(activities, activeCategoryId)
    : undefined;

  function handleCategoryPress(categoryId: number) {
    setActiveCategoryId((current) =>
      toggleSingleSelectFilter(current, categoryId),
    );
  }

  if (initError) {
    return (
      <Center>
        <Background showRed={false} />
        <ThemedText style={styles.errorText} variant="bodySmall">
          {initError}
        </ThemedText>
      </Center>
    );
  }

  if (dateColumns === undefined) {
    return (
      <Center>
        <Background showRed={false} />
        <ThemedText>No timeline data available.</ThemedText>
      </Center>
    );
  }

  if (!activities?.length) {
    return (
      <Center>
        <Background showRed={false} />
        <ThemedText>Add an activity to get started.</ThemedText>
      </Center>
    );
  }

  const isLoading =
    !(timelineQuery.isPending && !timelineQuery.data) &&
    !isLoadingTimeline &&
    isInitialScrollReady;

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <View style={[styles.isLoadingOverlay, isLoading && styles.hide]}>
        {!isInitialScrollReady && <Background />}
        <ActivityIndicator color={Colors.textPrimary} />
      </View>

      {/**
       *
       * Month Navigation
       *
       */}
      <View style={styles.monthNavigationRow}>
        <Pressable
          onPress={() => fetchMonth(monthInView, 'PREV')}
          disabled={isLoadingTimeline}
          style={[styles.navArrowButton]}
        >
          <AntDesign
            name="left"
            size={14}
            color={Colors.textFaint}
            style={styles.navArrowButtonIcon}
          />
        </Pressable>
        <ThemedText variant="eyebrow" size="3xl">
          {formatMonthLabel(monthInView)}
        </ThemedText>
        <Pressable
          onPress={() => fetchMonth(monthInView, 'NEXT')}
          disabled={isLoadingTimeline || monthInView === currentMonth}
          style={[
            styles.navArrowButton,
            monthInView === currentMonth && styles.navArrowButtonDisabled,
          ]}
        >
          <AntDesign
            name="right"
            size={14}
            color={Colors.textFaint}
            style={styles.navArrowButtonIcon}
          />
        </Pressable>
      </View>

      {/**
       *
       * Filters
       *
       */}
      <FilterList
        items={categories
          .filter((category) => category.id !== undefined)
          .map((category) => ({
            id: category.id!,
            name: category.name,
            color: category.color,
          }))}
        selectedIds={activeCategoryId}
        onItemPress={handleCategoryPress}
        style={styles.filterList}
      />

      <View style={styles.topRow}>
        {/* Blank corner cell - top left */}
        <View style={styles.cornerCell}>
          <ThemedText variant="eyebrow" size="xs" style={styles.cornerLabel}>
            Activity
          </ThemedText>
        </View>

        {/* Dates header — clipped so overflow is hidden */}
        <View style={styles.colHeaderClip}>
          <Animated.ScrollView
            ref={columnHeaderRef}
            style={[styles.headerRow]}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.headerDatesContainer}>
              {dateColumns.map((date) => (
                <View key={date.full} style={[styles.dateCell]}>
                  <ThemedText
                    variant="caption"
                    lineHeight={12}
                    style={styles.dateNumber}
                  >
                    {date.day}
                  </ThemedText>
                  <ThemedText
                    style={styles.dateWeekday}
                    weight="400"
                    size="sm"
                    lineHeight={16}
                  >
                    {date.weekday}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </View>
      </View>

      <View style={styles.bottomRow}>
        {/* Sports header — clipped so overflow is hidden */}
        <View style={styles.rowHeaderClip}>
          <Animated.ScrollView
            ref={rowHeaderRef}
            showsVerticalScrollIndicator={false}
          >
            {tableData &&
              filteredActivities?.map((activity) => (
                <View key={activity.id} style={styles.activityLabelCell}>
                  <View style={styles.activityLabelCellTextWrapper}>
                    <ThemedText
                      font="system"
                      variant="eyebrow"
                      size="sm"
                      weight="700"
                      numberOfLines={1}
                    >
                      {activity.ticker || activity.name}
                    </ThemedText>
                    {activity.daysUntil === 0 ? (
                      <ThemedText
                        variant="eyebrow"
                        weight="400"
                        size="xs"
                        style={styles.dueNowLabel}
                      >
                        Due now
                      </ThemedText>
                    ) : (
                      <ThemedText
                        variant="eyebrow"
                        weight="400"
                        size="xs"
                        style={styles.dueLaterLabel}
                      >
                        Due {activity.daysUntil}D
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))}
          </Animated.ScrollView>
        </View>

        {/* Content Grid */}
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandlerX}
          ref={scrollViewRef}
          onLayout={(event) => {
            viewportWidthRef.current = event.nativeEvent.layout.width;
            scrollToEndAndReveal();
            finalizePendingMonthScroll();
          }}
          onContentSizeChange={(contentWidth) => {
            contentWidthRef.current = contentWidth;
            scrollToEndAndReveal();
            finalizePendingMonthScroll();
          }}
        >
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandlerY}
            nestedScrollEnabled={true}
          >
            {tableData &&
              filteredActivities?.map((activity) => {
                const completedDates =
                  tableData[activity.id] || new Set<string>();
                return (
                  <View key={activity.id} style={styles.activityRow}>
                    {dateColumns.map((date) => {
                      const isCompleted = completedDates.has(date.full);
                      const cellKey = `${activity.id}-${date.full}`;
                      const isToggling = togglingCells.has(cellKey);
                      return (
                        <View key={cellKey} style={styles.statusCellContainer}>
                          <Pressable
                            disabled={isToggling}
                            onPress={() =>
                              handleCellClick(
                                cellKey,
                                activity.id,
                                date.full,
                                isCompleted,
                              )
                            }
                            hitSlop={{
                              left: CELL_GAP / 2,
                              right: CELL_GAP / 2,
                              top: CELL_GAP,
                              bottom: CELL_GAP,
                            }}
                            style={[
                              styles.statusCell,
                              isCompleted
                                ? styles.statusCellComplete
                                : styles.statusCellIncomplete,
                              isCompleted &&
                                activity.category?.color && {
                                  backgroundColor: activity.category?.color,
                                  boxShadow: `0px 0px 6px 1px ${activity.category.color}33`,
                                },
                              isToggling && styles.statusCellToggling,
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                );
              })}
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>

      {loadMoreError || toggleError ? (
        <View style={styles.footerOverlay}>
          {loadMoreError && (
            <ThemedText
              font="system"
              variant="bodySmall"
              style={styles.errorTextSmall}
            >
              {loadMoreError}
            </ThemedText>
          )}
          {toggleError && (
            <ThemedText
              font="system"
              variant="bodySmall"
              style={styles.errorTextSmall}
            >
              {toggleError}
            </ThemedText>
          )}
        </View>
      ) : null}
    </View>
  );
}

const NAV_ARROW_HEIGHT = 32;

const styles = StyleSheet.create({
  errorText: {
    color: Colors.dangerText,
    marginTop: Spacing.md,
  },
  container: {
    flex: 1,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: HEADERS_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    backgroundColor: HEADERS_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navArrowButton: {
    flexGrow: 0,
    color: Colors.textPrimary,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 40,
    height: NAV_ARROW_HEIGHT,
  },
  navArrowButtonIcon: {
    lineHeight: NAV_ARROW_HEIGHT,
    height: NAV_ARROW_HEIGHT,
    textAlign: 'center',
  },
  navArrowButtonDisabled: {
    opacity: 0.3,
  },
  topRow: {
    flexDirection: 'row',
  },
  bottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  cornerCell: {
    width: LEFT_COLUMN_WIDTH,
    height: ROW_HEIGHT + HEADER_ROW_EXTRA_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: HEADERS_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  cornerLabel: {
    color: Colors.textSecondary,
  },
  colHeaderClip: {
    flex: 1,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: ROW_HEIGHT + HEADER_ROW_EXTRA_HEIGHT,
  },
  rowHeaderClip: {
    width: LEFT_COLUMN_WIDTH,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  headerRow: {
    backgroundColor: HEADERS_BACKGROUND,
    width: '100%',
    zIndex: 20,
  },
  headerDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    height: '100%',
  },
  dateCell: {
    width: CELL_WIDTH,
    height: ROW_CONTENT_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dateNumber: {
    color: Colors.textFaint,
  },
  dateWeekday: {
    marginTop: Spacing.xxs,
    textTransform: 'uppercase',
  },
  activityLabelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.border,
    backgroundColor: HEADERS_BACKGROUND,
  },
  activityLabelCellTextWrapper: {
    // borderLeftWidth: 2,
    // borderLeftColor: Colors.accentGlow,
    // paddingLeft: Spacing.md,
  },
  dueNowLabel: {
    color: Colors.textPrimary,
  },
  dueLaterLabel: {
    color: Colors.textFaint,
  },
  isLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.scrimStrong,
    zIndex: 999,
  },
  hide: {
    display: 'none',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    borderBottomWidth: 1,
    borderColor: Colors.borderFaint,
  },
  statusCellContainer: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    borderRadius: 3,
  },
  statusCellComplete: {
    backgroundColor: Colors.accentBright,
    boxShadow: `0px 0px 8px 1px ${withAlpha(Colors.accentBright, 0.2)}`,
  },
  statusCellIncomplete: {
    backgroundColor: Colors.surfaceDisabled,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
  },
  statusCellToggling: {
    opacity: 0.5,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: Colors.surfaceInverse,
    padding: Spacing.md,
    borderRadius: 8,
    ...Shadows.overlay,
  },
  errorTextSmall: {
    color: Colors.dangerText,
    textAlign: 'center',
  },
});

export default TimelineScreen;
