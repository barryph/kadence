import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { activitiesAPI, type IActivity } from "@/api/api.activity";
import { timelineAPI, type ITimeline, type ITimelineSet } from '@/api/api.timeline';
import { Colors } from '@/constants/theme';
import StickyTable from '../../components/StickyTableTwo';

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
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();
  return daysLeft < 7;
}

export default function DualStickyScreen() {
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

  console.log('dateColumns', dateColumns);
  const tableData = activities.map((activity) => {
    const completedDates = timeline[activity.id];
    return dateColumns.map((date) => {
      const isCompleted = completedDates && completedDates.has(date.full);
      const cellKey = `${activity.id}-${date.full}`;
      const isToggling = togglingCells.has(cellKey);
      const onPress = () => handleTimelineCellClick(cellKey, activity.id, date.full, isCompleted)
      return { cellKey, isCompleted, isToggling, onPress };
    });
  });
  console.log('acts:', JSON.stringify(activities, null, 2));
  console.log('tableData:', JSON.stringify(tableData, null, 2));
  console.log('dateColumns:', JSON.stringify(dateColumns, null, 2));

  return (
    <View style={{ backgroundColor: '#fff', flex: 1 }}>
      <StickyTable
        columnHeaders={dateColumns}
        rowHeaders={activities}
        data={tableData}
        renderColumnHeader={(date) => <ColumnHeader date={date} />}
        renderRowHeader={(activity) => <RowHeader activity={activity} />}
        renderCell={(props) => <Cell {...props} />}
        cellWidth={100}
        cellHeight={50}
        headerWidth={120}
        headerHeight={50}
      />
    </View>
  )
}

function ColumnHeader({ date }: { date: TimelineDateColumn }) {
  return (
    <View key={date.full} style={styles.dateCell}>
      <Text style={styles.dateDay}>{date.day}</Text>
      <Text style={styles.dateMonth}>{date.month}</Text>
    </View>
  );
}

function RowHeader({ activity }: { activity: IActivity }) {
  return (
    <View key={activity.id} style={styles.activityLabelCell}>
      <Text style={styles.activityLabelText} numberOfLines={1}>
        {activity.ticker || activity.name}
      </Text>
    </View>
  );
}

function Cell({ cellKey, isCompleted, isToggling, onPress }: { cellKey: string, isCompleted: boolean, isToggling: boolean, onPress: () => void }) {
  return (
    <View key={cellKey} style={styles.statusCellContainer}>
      <TouchableOpacity
        disabled={isToggling}
        onPress={onPress}
        style={[
          styles.statusCell,
          isCompleted ? styles.statusCellComplete : styles.statusCellIncomplete,
          isToggling && styles.statusCellToggling
        ]}
      />
    </View>
  );
}

const CELL_SIZE = 20;
const CELL_GAP = 13;
const ROW_CONTENT_SIZE = 36;
const ROW_HEIGHT = ROW_CONTENT_SIZE + (CELL_GAP * 2);
const LOAD_MORE_WIDTH = 170;
const LEFT_COLUMN_WIDTH = 120; // To allow the ticker text to show

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
    color: '#fff',
    fontSize: 14,
    lineHeight: 14,
  },
  dateMonth: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
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
  loadMoreButton: {
    width: '100%',
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

const exampleStyles = StyleSheet.create({
  headerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  cellText: { fontSize: 13, color: '#333' },
});
