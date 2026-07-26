import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { activitiesAPI, type IActivity } from '@/api/api.activity';
import {
  timelineAPI,
  type ITimeline,
  type ITimelineSet,
} from '@/api/api.timeline';
import Button from '@/components/base/button';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import Background from '@/components/backgrounds/background';
import Center from '@/components/ui/center';
import { ThemedText } from '@/components/base/themed-text';
import LoaderScreen from '@/components/base/loader-screen';

// TODO: Sync changes when completing tasks in main page, and timeline
// TODO: Add day of the week name to the date row

const CELL_WIDTH = 35;
const CELL_HEIGHT = 12;
const CELL_GAP = 8;
const ROW_CONTENT_SIZE = 25;
const ROW_HEIGHT = ROW_CONTENT_SIZE + CELL_GAP * 2;
const LOAD_MORE_WIDTH = 40;
const LEFT_COLUMN_WIDTH = 80; // To allow the ticker text to show
// const headersBackground = '#1a4163';
const headersBackground = 'rgba(26, 65, 99, 0.30)';

type TimelineDateColumn = {
  full: string;
  month: string;
  day: string;
};

function toTimelineDateColumn(date: Date): TimelineDateColumn {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return {
    full: `${year}-${month}-${day}`,
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.toLocaleDateString(undefined, { day: 'numeric' }),
  };
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildMonthDateColumns(month: string): TimelineDateColumn[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const lastDayOfMonth = monthEnd.getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === monthNumber;
  // Never render future dates — cap the current month at today
  const endDay = isCurrentMonth
    ? Math.min(lastDayOfMonth, today.getDate())
    : lastDayOfMonth;
  const endDate = new Date(year, monthNumber - 1, endDay, 12);
  const columns: TimelineDateColumn[] = [];

  for (
    const cursorDate = new Date(monthStart);
    cursorDate <= endDate;
    cursorDate.setDate(cursorDate.getDate() + 1)
  ) {
    columns.push(toTimelineDateColumn(new Date(cursorDate)));
  }

  return columns;
}

function timelineToSet(timeline: ITimeline): ITimelineSet {
  return Object.keys(timeline).reduce<ITimelineSet>((acc, key) => {
    acc[key] = new Set(timeline[key]);
    return acc;
  }, {});
}

function getCurrentMonth() {
  const date = new Date();
  return formatMonthKey(date);
}

function TimelineScreen() {
  const [activities, setActivities] = useState<IActivity[] | undefined>();
  const [cachedMonths, setCachedMonths] = useState<
    Record<string, ITimelineSet>
  >({});
  const currentMonth = getCurrentMonth();
  const [monthInView, setMonthInView] = useState<string>(currentMonth);
  const [dateColumns, setDateColumns] = useState<TimelineDateColumn[]>([]);
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [initError, setInitError] = useState<string | undefined>(undefined);
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
   * Load initial data
   */
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchInitData(abortController: AbortController) {
      try {
        setInitError(undefined);
        const [activitiesRes, timelineRes] = await Promise.all([
          activitiesAPI.getAllByUser({ signal: abortController.signal }),
          timelineAPI.getTimeline(monthInView, {
            signal: abortController.signal,
          }),
        ]);
        if (activitiesRes.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
        if (timelineRes.data?.timeline) {
          let timeline = timelineToSet(timelineRes.data.timeline);
          const columns = buildMonthDateColumns(monthInView);

          setCachedMonths({ ...cachedMonths, [monthInView]: timeline });
          setDateColumns(columns);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setInitError('Unable to load timeline. Please try again.');
          console.error('Error fetching init timeline data', err);
        }
      } finally {
        setIsLoadInitData(false);
      }
    }

    fetchInitData(abortController);
    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  async function fetchMonth(monthInView: string, direction: 'PREV' | 'NEXT') {
    const month = getNextMonthToLoad(monthInView, direction);
    // PREV → land at end of month; NEXT → land at start. Applied after layout.
    pendingMonthScrollRef.current = direction === 'PREV' ? 'end' : 'start';

    try {
      setIsLoadingTimeline(true);
      setLoadMoreError(undefined);
      const response = await timelineAPI.getTimeline(month);
      if (response.data?.timeline) {
        const timeline = timelineToSet(response.data.timeline);
        const columns = buildMonthDateColumns(month);
        setCachedMonths((prev) => ({ ...prev, [month]: timeline }));
        setDateColumns(columns);
        setMonthInView(month);
        // Keep overlay up until finalizePendingMonthScroll positions the view
      } else {
        pendingMonthScrollRef.current = null;
        setIsLoadingTimeline(false);
      }
    } catch (err) {
      pendingMonthScrollRef.current = null;
      setLoadMoreError('Unable to load more timeline. Please try again.');
      console.error('Error fetching more timeline', err);
      setIsLoadingTimeline(false);
    }
  }

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
    activityId: string,
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

      const response = isCompleting
        ? await activitiesAPI.complete(activityId, dateKey)
        : await activitiesAPI.undo(activityId, dateKey);

      if (response.error) {
        throw new Error(response.error.message);
      }

      setCachedMonths((prevCachedMonths) => {
        // if (!prevCachedMonths) return prevCachedMonths;

        // Create new object rather than mutating existing
        const newCachedMonths = { ...prevCachedMonths };
        const month = newCachedMonths[monthInView];
        const completedDates = month[activityId];

        // Update client side toggle value of the cell
        if (isCompleting) {
          completedDates.add(dateKey);
        } else {
          completedDates.delete(dateKey);
        }

        return newCachedMonths;
      });
    } catch (err) {
      setToggleError('Unable to update activity status. Please try again.');
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

  const tableData = cachedMonths[monthInView];

  if (isLoadingInitData) {
    return <LoaderScreen text="Loading timeline..." />;
  }

  if (initError) {
    return (
      <Center>
        <Background showRed={false} />
        <ThemedText style={styles.errorText}>{initError}</ThemedText>
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

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <View
        style={[
          styles.isLoadingOverlay,
          !isLoadingTimeline && isInitialScrollReady && styles.hide,
        ]}
      >
        {!isInitialScrollReady && <Background />}
        <ActivityIndicator color="#fff" />
        <ThemedText style={{ color: '#fff', marginTop: 15 }}>
          Loading timeline...
        </ThemedText>
      </View>

      <View style={styles.topRow}>
        {/* Blank corner cell - top left */}
        <View style={styles.cornerCell}></View>

        {/* Dates header — clipped so overflow is hidden */}
        <View style={styles.colHeaderClip}>
          <Animated.ScrollView
            ref={columnHeaderRef}
            style={[styles.headerRow]}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.paddingElementForLoadMoreColumn}></View>
            <View style={styles.headerDatesContainer}>
              {dateColumns.map((date) => (
                <View key={date.full} style={[styles.dateCell]}>
                  <Text style={styles.dateDay}>{date.day}</Text>
                  <Text style={styles.dateMonth}>{date.month}</Text>
                </View>
              ))}
            </View>
            <View style={styles.paddingElementForLoadMoreColumn}></View>
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
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityLabelCell}>
                <Text style={styles.activityLabelText} numberOfLines={1}>
                  {activity.ticker || activity.name}
                </Text>
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
          <View style={[styles.loadMoreColumn]}>
            <Button
              onPress={() => fetchMonth(monthInView, 'PREV')}
              isLoading={isLoadingTimeline}
              style={styles.loadMoreButton}
              textStyle={styles.loadMoreButtonTextStyles}
            >
              {isLoadingTimeline ? 'Loading...' : <>&larr;</>}
            </Button>
          </View>

          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandlerY}
            nestedScrollEnabled={true}
          >
            {activities.map((activity) => {
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
                          style={[
                            styles.statusCell,
                            isCompleted
                              ? styles.statusCellComplete
                              : styles.statusCellIncomplete,
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

          {monthInView !== currentMonth && (
            <View style={[styles.loadMoreColumn]}>
              <Button
                onPress={() => fetchMonth(monthInView, 'NEXT')}
                isLoading={isLoadingTimeline}
                style={styles.loadMoreButton}
                textStyle={styles.loadMoreButtonTextStyles}
              >
                {isLoadingTimeline ? 'Loading...' : <>&rarr;</>}
              </Button>
            </View>
          )}
        </Animated.ScrollView>
      </View>

      {loadMoreError || toggleError ? (
        <View style={styles.footerOverlay}>
          {loadMoreError && (
            <Text style={styles.errorTextSmall}>{loadMoreError}</Text>
          )}
          {toggleError && (
            <Text style={styles.errorTextSmall}>{toggleError}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 8,
  },
  container: {
    flex: 1,
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
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,.1)',
    backgroundColor: headersBackground,
  },
  colHeaderClip: {
    flex: 1,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.1)',
    height: ROW_HEIGHT,
  },
  rowHeaderClip: {
    width: LEFT_COLUMN_WIDTH,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,.1)',
  },
  headerRow: {
    backgroundColor: headersBackground,
    height: ROW_HEIGHT,
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
    alignItems: 'center',
  },
  dateDay: {
    // color: '#5d6778',
    color: '#fff',
    fontSize: 14,
    lineHeight: 14,
  },
  dateMonth: {
    // color: '#5d6778',
    color: '#fff',
    fontSize: 10,
    lineHeight: 14,
  },
  activityLabelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.1)',
    backgroundColor: headersBackground,
  },
  activityLabelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  isLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000aa',
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
    // borderBottomWidth: 1,
    // borderBottomColor: 'rgba(255,255,255,.1)',
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
    //backgroundColor: '#ff3d54',
    backgroundColor: 'rgb(3,141,240)',
    boxShadow: '0px 0px 8px 1px rgba(3,141,240,0.20)',
  },
  statusCellIncomplete: {
    backgroundColor: 'rgba(155, 155, 155, 0.1)',
    // borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
  },
  statusCellToggling: {
    opacity: 0.5,
  },
  loadMoreColumn: {
    width: LOAD_MORE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    padding: CELL_GAP,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.1)',
  },
  paddingElementForLoadMoreColumn: {
    width: LOAD_MORE_WIDTH,
  },
  loadMoreButton: {
    flexGrow: 0,
    color: '#fff',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  loadMoreButtonTextStyles: {
    fontSize: 40,
  },
  footerOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  loadingMoreText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTextSmall: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default function wrapper() {
  return (
    <UnmountOnBlur>
      <TimelineScreen />
    </UnmountOnBlur>
  );
}
