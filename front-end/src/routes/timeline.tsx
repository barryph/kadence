import './timeline.css';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react';
import { activitiesAPI, type IActivity } from "../api/api.activity";
import { timelineAPI, type ITimeline, type ITimelineSet } from '../api/api.timeline';
import Button from '../components/Button';

export const Route = createFileRoute('/timeline')({
  component: Timeline,
})

const DAY_MS = 24 * 60 * 60 * 1000;

type TimelineDateColumn = {
  key: string;
  month: string;
  day: string;
};

function toTimelineDateColumn(date: Date): TimelineDateColumn {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return {
    key: `${year}-${month}-${day}`,
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    day: date.toLocaleDateString(undefined, { day: 'numeric' }),
  };
}

function buildMonthDateColumns(month: string, endDayInMonth?: number): TimelineDateColumn[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const lastDay = endDayInMonth ?? monthEnd.getDate();
  const boundedEndDay = Math.max(1, Math.min(lastDay, monthEnd.getDate()));
  const endDate = new Date(year, monthNumber - 1, boundedEndDay);
  const columns: TimelineDateColumn[] = [];

  for (let cursor = endDate.getTime(); cursor >= monthStart.getTime(); cursor -= DAY_MS) {
    columns.push(toTimelineDateColumn(new Date(cursor)));
  }

  return columns;
}

function getPreviousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const previousMonthDate = new Date(year, monthNumber - 2, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = String(previousMonthDate.getMonth() + 1).padStart(2, '0');
  return `${previousYear}-${previousMonth}`;
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
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      const today = new Date();
      const initMonth = today.toISOString().slice(0, 7); // Format is: "YYYY-MM"
      const shouldAutoLoadNextMonth = getShouldAutoLoadNextMonth(today);
      const nextMonth = getPreviousMonth(initMonth);

      const nextMonthRequest = shouldAutoLoadNextMonth
        ? timelineAPI.getTimeline(nextMonth, { signal: abortController.signal })
        : Promise.resolve(undefined);

      try {
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
              const nextMonth = getPreviousMonth(initMonth);
              mergedTimeline = mergeTimelineSets(mergedTimeline, timelineToSet(nextMonthRes.data.timeline));
              months.push(nextMonth);
              columns.push(...buildMonthDateColumns(nextMonth));
            }
          }

          setTimeline(mergedTimeline);
          setLoadedMonths(months);
          setDateColumns(columns);
        }

        setIsLoadInitData(false);
      } catch (err) {
        console.error('Error fetching init timeline data', err);
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
      const response = await timelineAPI.getTimeline(month);
      if (response.data?.timeline) {
        const timelineSet = timelineToSet(response.data.timeline);
        setTimeline((prevTimeline) => mergeTimelineSets(prevTimeline ?? {}, timelineSet));
        setLoadedMonths((prevLoadedMonths) => [...prevLoadedMonths, month]);
        setDateColumns((prevDateColumns) => [...prevDateColumns, ...buildMonthDateColumns(month)]);
      }
    } catch (err) {
      console.error('Error fetching more timeline', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  }

  const nextMonthToLoad = useMemo(() => {
    if (!loadedMonths.length) return;
    return getPreviousMonth(loadedMonths[loadedMonths.length - 1]);
  }, [loadedMonths]);

  if (isLoadingInitData || timeline === undefined) {
    return <div className="timeline-loading">Loading timeline...</div>;
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
                  <div key={date.key} className="timeline-date-cell">
                    <span className="timeline-date-month">{date.month}</span>
                    <span className="timeline-date-day">{date.day}</span>
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
                        const isCompleted = completedDates.has(date.key);
                        return (
                          <div
                            key={`${activity.id}-${date.key}`}
                            className={`timeline-status-cell ${isCompleted ? 'timeline-status-cell--complete' : 'timeline-status-cell--incomplete'}`}
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
    </div>
  );
}
