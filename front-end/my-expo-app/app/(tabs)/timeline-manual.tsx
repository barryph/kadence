import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { activitiesAPI, type IActivity } from "@/api/api.activity";
import { timelineAPI, type ITimeline, type ITimelineSet } from '@/api/api.timeline';
import Button from '@/components/Button';
import { Colors } from '@/constants/theme';
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';

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

function buildMonthDateColumns(month: string, endDayInMonth?: number): TimelineDateColumn[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const lastDay = endDayInMonth ?? monthEnd.getDate();
  const boundedEndDay = Math.max(1, Math.min(lastDay, monthEnd.getDate()));
  const endDate = new Date(year, monthNumber - 1, boundedEndDay, 12);
  const columns: TimelineDateColumn[] = [];

  for (const cursorDate = new Date(monthStart); cursorDate <= endDate; cursorDate.setDate(cursorDate.getDate() + 1)) {
    columns.push(toTimelineDateColumn(new Date(cursorDate)));
  }

  return columns;
}

function getNextMonthToLoad(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const nextMonthToLoad = new Date(year, monthNumber - 2, 1);
  return formatMonthKey(nextMonthToLoad);
}

function timelineToSet(timeline: ITimeline): ITimelineSet {
  return Object.keys(timeline).reduce<ITimelineSet>((acc, key) => {
    acc[key] = new Set(timeline[key]);
    return acc;
  }, {});
}

function mergeTimelineSets(currentTimeline: ITimelineSet, nextTimeline: ITimelineSet): ITimelineSet {
  const allKeys = new Set([...Object.keys(currentTimeline), ...Object.keys(nextTimeline)]);

  return Array.from(allKeys).reduce<ITimelineSet>((acc, key) => {
    acc[key] = new Set([...(currentTimeline[key] ?? []), ...(nextTimeline[key] ?? [])]);
    return acc;
  }, {});
}

function getShouldAutoLoadNextMonth(today: Date): boolean {
  if (today.getDate() <= 7) return true;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();
  return daysLeft < 7;
}

export default function TimelineScreen() {
  // TODO: Start scrolled to the right
  const [activities, setActivities] = useState<IActivity[] | undefined>();
  const [timeline, setTimeline] = useState<ITimelineSet | undefined>();
  const [dateColumns, setDateColumns] = useState<TimelineDateColumn[]>([]);
  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [initError, setInitError] = useState<string | undefined>(undefined);
  const [loadMoreError, setLoadMoreError] = useState<string | undefined>(undefined);
  const [toggleError, setToggleError] = useState<string | undefined>(undefined);

  // Removed Animated scrollX and headerScrollRef

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      const today = new Date();
      const initMonth = formatMonthKey(today);
      const shouldAutoLoadNextMonth = getShouldAutoLoadNextMonth(today);
      const nextMonthToLoad = getNextMonthToLoad(initMonth);

      const nextMonthRequest = shouldAutoLoadNextMonth
        ? timelineAPI.getTimeline(nextMonthToLoad, { signal: abortController.signal })
        : Promise.resolve(undefined);

      try {
        setInitError(undefined);
        const [activitiesRes, timelineRes, nextMonthRes] = await Promise.all([
          activitiesAPI.getAllByUser({ signal: abortController.signal }),
          timelineAPI.getTimeline(initMonth, { signal: abortController.signal }),
          nextMonthRequest,
        ]);
        if (activitiesRes.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
        if (timelineRes.data?.timeline) {
          let mergedTimeline = timelineToSet(timelineRes.data.timeline);
          const months = [initMonth];
          const columns = buildMonthDateColumns(initMonth, today.getDate());

          if (shouldAutoLoadNextMonth) {
            if (nextMonthRes?.data?.timeline) {
              const nextMonth = getNextMonthToLoad(initMonth);
              mergedTimeline = mergeTimelineSets(mergedTimeline, timelineToSet(nextMonthRes.data.timeline));
              months.push(nextMonth);
              columns.unshift(...buildMonthDateColumns(nextMonth));
            }
          }

          setTimeline(mergedTimeline);
          setLoadedMonths(months);
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

    fetchData();
    return () => {
      abortController.abort();
    }
  }, []);

  async function fetchMoreTimeline(month: string) {
    try {
      setIsLoadingTimeline(true);
      setLoadMoreError(undefined);
      const response = await timelineAPI.getTimeline(month);
      if (response.data?.timeline) {
        const timelineSet = timelineToSet(response.data.timeline);
        setTimeline((prevTimeline) => mergeTimelineSets(prevTimeline ?? {}, timelineSet));
        setLoadedMonths((prevLoadedMonths) => [...prevLoadedMonths, month]);
        setDateColumns((prevDateColumns) => [...buildMonthDateColumns(month), ...prevDateColumns]);
      }
    } catch (err) {
      setLoadMoreError('Unable to load more timeline. Please try again.');
      console.error('Error fetching more timeline', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  }

  async function handleTimelineCellClick(cellKey: string, activityId: string, dateKey: string, isCompleted: boolean) {
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

      setTimeline((prevTimeline) => {
        if (!prevTimeline) return prevTimeline;

        const nextTimeline = { ...prevTimeline };
        const nextCompletedDates = new Set(nextTimeline[activityId] ?? []);

        if (isCompleting) {
          nextCompletedDates.add(dateKey);
        } else {
          nextCompletedDates.delete(dateKey);
        }

        nextTimeline[activityId] = nextCompletedDates;
        return nextTimeline;
      });
    } catch (err) {
      setToggleError('Unable to update activity status. Please try again.');
      console.error('Error updating timeline activity status', err);
    } finally {
      setTogglingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  }

  const nextMonthToLoad = useMemo(() => {
    if (!loadedMonths.length) return;
    return getNextMonthToLoad(loadedMonths[loadedMonths.length - 1]);
  }, [loadedMonths]);

  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // Runs on the UI thread
  const scrollHandlerX = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  const scrollHandlerY = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const columnHeaderRef = useAnimatedRef();
  const rowHeaderRef = useAnimatedRef();
  const bodyRef = useAnimatedRef();
  const bodyRefHorizontal = useAnimatedRef();

  // Sync the "scroll" position of the headers with the body
  useDerivedValue(() => {
    scrollTo(columnHeaderRef, scrollX.value, 0, false);
  });
  useDerivedValue(() => {
    scrollTo(rowHeaderRef, 0, scrollY.value, false);
  });

  if (isLoadingInitData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.blue.new} />
        <Text style={styles.loadingText}>Loading timeline...</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{initError}</Text>
      </View>
    );
  }

  if (timeline === undefined) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>No timeline data available.</Text>
      </View>
    );
  }

  if (!activities?.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>No activities yet.</Text>
      </View>
    );
  }

  // console.log('dc', dateColumns);
  // console.log('activities', activities);
  // console.log('timeline', timeline)
  // console.log('timeline',
  //   Object.keys(timeline).reduce((obj, x) => {
  //     obj[x] = Array.from(timeline[x])
  //     return obj;
  //   }, {}),
  // )

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Blank corner cell - top left */}
        <View style={styles.cornerCell}></View>

        {/* Dates header — clipped so overflow is hidden */}
        <View style={styles.colHeaderClip}>
          <Animated.ScrollView ref={columnHeaderRef} style={[styles.headerRow]} horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.headerDatesContainer}>
              {dateColumns.map((date) => (
                <View key={date.full} style={[styles.dateCell]}>
                  {/* TODO: USE as renderColumnHeader */}
                  <Text style={styles.dateDay}>{date.day}</Text>
                  <Text style={styles.dateMonth}>{date.month}</Text>
                </View>
              ))}
            </View>
            {/* TODO: Render as last column */}
            <View style={styles.paddingElementForLoadMoreColumn}></View>
          </Animated.ScrollView>
        </View>
      </View>

      <View style={styles.bottomRow}>
        {/* Sports header — clipped so overflow is hidden */}
        <View style={styles.rowHeaderClip}>
          <Animated.ScrollView ref={rowHeaderRef} showsVerticalScrollIndicator={false}>
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityLabelCell}>
                {/* TODO: USE as renderRowHeader */}
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
          onScroll={scrollHandlerX}
        >
          <Animated.ScrollView
            onScroll={scrollHandlerY}
            nestedScrollEnabled={true}
          >
            {activities.map((activity) => {
              const completedDates = timeline[activity.id] || new Set<string>();
              return (
                <View key={activity.id} style={styles.activityRow}>
                  {dateColumns.map((date) => {
                    const isCompleted = completedDates.has(date.full);
                    const cellKey = `${activity.id}-${date.full}`;
                    const isToggling = togglingCells.has(cellKey);
                    return (
                      <View key={cellKey} style={styles.statusCellContainer}>
                        <TouchableOpacity
                          disabled={isToggling}
                          onPress={() => handleTimelineCellClick(cellKey, activity.id, date.full, isCompleted)}
                          style={[
                            styles.statusCell,
                            isCompleted ? styles.statusCellComplete : styles.statusCellIncomplete,
                            isToggling && styles.statusCellToggling
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </Animated.ScrollView>
          {/* <View><Text>AAAAA</Text></View> */}

          <View style={[styles.loadMoreColumn]}>
            <Button
              onPress={() => nextMonthToLoad && fetchMoreTimeline(nextMonthToLoad)}
              isLoading={isLoadingTimeline || !nextMonthToLoad}
              style={styles.loadMoreButton}
            >
              {isLoadingTimeline ? 'Loading...' : 'Load more'}
            </Button>
          </View>
        </Animated.ScrollView>
      </View>

      {/* <View style={styles.bodyRow}> */}
      {/*   <View style={styles.leftColumn}> */}
      {/*     {activities.map((activity) => ( */}
      {/*       <View key={activity.id} style={styles.activityLabelCell}> */}
      {/*         <Text style={styles.activityLabelText} numberOfLines={1}> */}
      {/*           {activity.ticker || activity.name} */}
      {/*         </Text> */}
      {/*       </View> */}
      {/*     ))} */}
      {/*   </View> */}
      {/**/}
      {/*   <View style={styles.matrixContainer}> */}
      {/*     <View style={styles.matrix}> */}
      {/*       {activities.map((activity) => { */}
      {/*         const completedDates = timeline[activity.id] || new Set<string>(); */}
      {/*         return ( */}
      {/*           <View key={activity.id} style={styles.activityRow}> */}
      {/*             {dateColumns.map((date) => { */}
      {/*               const isCompleted = completedDates.has(date.full); */}
      {/*               const cellKey = `${activity.id}-${date.full}`; */}
      {/*               const isToggling = togglingCells.has(cellKey); */}
      {/*               return ( */}
      {/*                 <View key={cellKey} style={styles.statusCellContainer}> */}
      {/*                   <TouchableOpacity */}
      {/*                     disabled={isToggling} */}
      {/*                     onPress={() => handleTimelineCellClick(cellKey, activity.id, date.full, isCompleted)} */}
      {/*                     style={[ */}
      {/*                       styles.statusCell, */}
      {/*                       isCompleted ? styles.statusCellComplete : styles.statusCellIncomplete, */}
      {/*                       isToggling && styles.statusCellToggling */}
      {/*                     ]} */}
      {/*                   /> */}
      {/*                 </View> */}
      {/*               ); */}
      {/*             })} */}
      {/*           </View> */}
      {/*         ); */}
      {/*       })} */}
      {/*     </View> */}
      {/**/}
      {/*     <View style={styles.loadMoreColumn}> */}
      {/*       <Button */}
      {/*         onPress={() => nextMonthToLoad && fetchMoreTimeline(nextMonthToLoad)} */}
      {/*         isLoading={isLoadingTimeline || !nextMonthToLoad} */}
      {/*         style={styles.loadMoreButton} */}
      {/*       > */}
      {/*         {isLoadingTimeline ? 'Loading...' : 'Load more →'} */}
      {/*       </Button> */}
      {/*     </View> */}
      {/*   </View> */}
      {/* </View> */}

      {(isLoadingTimeline || loadMoreError || toggleError) ? (
        <View style={styles.footerOverlay}>
          {isLoadingTimeline && <Text style={styles.loadingMoreText}>Loading more timeline...</Text>}
          {loadMoreError && <Text style={styles.errorTextSmall}>{loadMoreError}</Text>}
          {toggleError && <Text style={styles.errorTextSmall}>{toggleError}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const CELL_SIZE = 20;
const CELL_GAP = 13;
const ROW_CONTENT_SIZE = 36;
const ROW_HEIGHT = ROW_CONTENT_SIZE + (CELL_GAP * 2);
const LOAD_MORE_WIDTH = 170;
const LEFT_COLUMN_WIDTH = 80; // To allow the ticker text to show

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomColor: '#e5e8ef',
    borderRightWidth: 1,
    borderRightColor: '#e5e8ef',
  },
  cornerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  colHeaderClip: {
    flex: 1,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8ef',
    height: ROW_HEIGHT,
  },
  rowHeaderClip: {
    width: LEFT_COLUMN_WIDTH,
    overflow: 'hidden', // Stop overflowing the blank corner, z-index on cornerCell also works
    borderRightWidth: 1,
    borderRightColor: '#e5e8ef',
  },
  headerRow: {
    height: ROW_HEIGHT,
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 20,
  },
  leftColumnHeader: {
    height: '100%',
    width: LEFT_COLUMN_WIDTH - CELL_GAP,
    borderRightWidth: 1,
    borderRightColor: '#e5e8ef',
  },
  headerScroll: {
    flex: 1,
  },
  headerDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    height: '100%',
  },
  dateCell: {
    width: CELL_SIZE,
    height: ROW_CONTENT_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dateDay: {
    color: '#5d6778',
    fontSize: 14,
    lineHeight: 14,
  },
  dateMonth: {
    color: '#5d6778',
    fontSize: 13,
    lineHeight: 14,
  },
  headerTailSpacer: {
    width: LOAD_MORE_WIDTH,
    height: ROW_CONTENT_SIZE,
  },
  bodyVerticalScroll: {
    flex: 1,
  },
  bodyRow: {
    flexDirection: 'row',
    color: 'red',
  },
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    minWidth: LEFT_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#e5e8ef',
    flexShrink: 0,
  },
  activityLabelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  activityLabelText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '800',
  },
  matrixContainer: {
    flexDirection: 'row',
    color: 'green',
  },
  matrix: {
    flexDirection: 'column',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: CELL_GAP,
    gap: CELL_GAP,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f7',
  },
  statusCellContainer: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  statusCellComplete: {
    backgroundColor: '#2f6dff',
  },
  statusCellIncomplete: {
    backgroundColor: '#cfd6e2',
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
    borderBottomColor: '#f0f2f7',
  },
  paddingElementForLoadMoreColumn: {
    width: LOAD_MORE_WIDTH,
  },
  loadMoreButton: {
    flexGrow: 0,
    fontSize: 14,
    color: '#0072ff',
    backgroundColor: '#fff',
    textDecorationLine: 'underline',
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
  }
});
