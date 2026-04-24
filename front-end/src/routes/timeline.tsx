import './timeline.css';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react';
import { activitiesAPI, type IActivity } from "../api/api.activity";
import { timelineAPI, type ITimeline, type ITimelineSet } from '../api/api.timeline';
import Button from '../components/Button';

// TODO: Add borders between weeks and between months
// TODO: Add dropdown to select a specific month

export const Route = createFileRoute('/timeline')({
  component: Timeline,
})

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

  for (const cursorDate = new Date(endDate); cursorDate >= monthStart; cursorDate.setDate(cursorDate.getDate() - 1)) {
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

function Timeline() {
  const [activities, setActivities] = useState<IActivity[] | undefined>();
  const [timeline, setTimeline] = useState<ITimelineSet | undefined>();
  const [dateColumns, setDateColumns] = useState<TimelineDateColumn[]>([]);
  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
  // Lists cells which are actively updating their state
  const [togglingCells, setTogglingCells] = useState<Set<string>>(new Set());
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [initError, setInitError] = useState<string | undefined>(undefined);
  const [loadMoreError, setLoadMoreError] = useState<string | undefined>(undefined);
  const [toggleError, setToggleError] = useState<string | undefined>(undefined);

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
              columns.push(...buildMonthDateColumns(nextMonth));
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
        setDateColumns((prevDateColumns) => [...prevDateColumns, ...buildMonthDateColumns(month)]);
      }
    } catch (err) {
      setLoadMoreError('Unable to load more timeline. Please try again.');
      console.error('Error fetching more timeline', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  }

  async function handleTimelineCellClick(cellKey: string, activityId: string, dateKey: string, isCompleted: boolean) {
    // If toggle already in process
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
    return <div className="timeline-loading">Loading timeline...</div>;
  }

  if (initError) {
    return <div className="timeline-loading">{initError}</div>;
  }

  if (timeline === undefined) {
    return <div className="timeline-loading">No timeline data available.</div>;
  }

  if (!activities?.length) {
    return <div className="timeline-loading">No activities yet.</div>;
  }

  return (
    <div className="timeline-page">
      <div className="timeline-grid-shell">
        <div className="timeline-left-column">
          <div className="timeline-header-spacer" />
          {activities.map((activity) => (
            <div key={activity.id} className="timeline-activity-label">
              {activity.ticker || activity.name}
            </div>
          ))}
        </div>

        <div className="timeline-right-scroll" role="region" aria-label="Activity timeline">
          <div className="timeline-scroll-content">
            <div className="timeline-header-row">
              {dateColumns.map((date) => {
                return (
                  <div key={date.full} className="timeline-date-cell">
                    <span className="timeline-date-day">{date.day}</span>
                    <span className="timeline-date-month">{date.month}</span>
                  </div>
                );
              })}
              <div className="timeline-header-tail-spacer" />
            </div>

            <div className="timeline-body-with-load-more">
              <div className="timeline-body">
                {activities.map((activity) => {
                  const completedDates = timeline[activity.id] || new Set<string>();

                  return (
                    <div key={activity.id} className="timeline-activity-row">
                      {dateColumns.map((date) => {
                        const isCompleted = completedDates.has(date.full);
                        const cellKey = `${activity.id}-${date.full}`;
                        const isToggling = togglingCells.has(cellKey);
                        return (
                          <div
                            key={cellKey}
                            className={`timeline-status-cell ${isCompleted ? 'timeline-status-cell--complete' : 'timeline-status-cell--incomplete'}`}
                            role="button"
                            tabIndex={0}
                            aria-label={`${isCompleted ? 'Undo' : 'Complete'} ${activity.ticker || activity.name} on ${date.full}`}
                            aria-disabled={isToggling}
                            onClick={() => handleTimelineCellClick(cellKey, activity.id, date.full, isCompleted)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <div className="timeline-load-more-column">
                <Button
                  type="button"
                  variant="blank"
                  onClick={() => nextMonthToLoad && fetchMoreTimeline(nextMonthToLoad)}
                  isLoading={isLoadingTimeline || !nextMonthToLoad}
                >
                  {isLoadingTimeline ? (
                    'Loading...'
                  ) : (
                    <>
                      Load more &rarr;
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoadingTimeline ? <div className="timeline-loading-more">Loading more timeline...</div> : null}
      {loadMoreError ? <div className="timeline-loading-more">{loadMoreError}</div> : null}
    </div>
  );
}
