import './timeline.css';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { activitiesAPI, type IActivity } from "../api/api.activity";
import { timelineAPI, type ITimeline } from '../api/api.timeline';

export const Route = createFileRoute('/timeline')({
  component: Timeline,
})

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateColumns(): string[] {
  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const columns: string[] = [];

  for (let cursor = todayAtMidnight.getTime(); cursor >= monthStart.getTime(); cursor -= DAY_MS) {
    columns.push(formatDateKey(new Date(cursor)));
  }

  return columns;
}

function toDateLabelParts(dateStr: string): { month: string; day: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return {
    month: localDate.toLocaleDateString(undefined, { month: 'short' }),
    day: localDate.toLocaleDateString(undefined, { day: 'numeric' }),
  };
}

function Timeline() {
  const [activities, setActivities] = useState<IActivity[] | undefined>();
  const [timeline, setTimeline] = useState<ITimeline | undefined>();
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      const initMonth = new Date().toISOString().slice(0, 7); // Format is: "YYYY-MM"
      try {
        const [activitiesRes, timelineRes] = await Promise.all([
          activitiesAPI.getAllByUser({ signal: abortController.signal }),
          timelineAPI.getTimeline(initMonth, { signal: abortController.signal }),
        ]);
        if (activitiesRes.data?.activities) {
          setActivities(activitiesRes.data.activities);
        }
        if (timelineRes.data?.timeline) {
          setTimeline(timelineRes.data.timeline);
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

  function mergeTimelines(timeline: ITimeline, timeline2: ITimeline): ITimeline {
    const allKeys = new Set([...Object.keys(timeline), ...Object.keys(timeline2)]);
    const newTimeline = Array.from(allKeys).reduce((acc: ITimeline, key: string) => {
      const t1Row = timeline[key] || [];
      const t2Row = timeline2[key] || [];
      acc[key] = [...t1Row, ...t2Row];
      return acc;
    }, {});
    return newTimeline;
  }

  async function fetchMoreTimeline(month: string) {
    try {
      setIsLoadingTimeline(true);
      const response = await timelineAPI.getTimeline(month);
      console.log('tl response', response);
      if (response.data?.timeline) {
        const newTimeline = mergeTimelines(timeline || {}, response.data.timeline);
        setTimeline(newTimeline);;
        setIsLoadingTimeline(false);
      }
    } catch (err) {
      console.error('Error fetching more timeline', err);
    }
  }

  const dateColumns = getCurrentMonthDateColumns();
  const timelineLookup = Object.entries(timeline || {}).reduce<Record<string, Set<string>>>(
    (acc, [activityId, completedDates]) => {
      acc[activityId] = new Set(completedDates);
      return acc;
    },
    {},
  );

  if (isLoadingInitData) {
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
                const dateLabel = toDateLabelParts(date);
                return (
                  <div key={date} className="timeline-date-cell">
                    <span className="timeline-date-month">{dateLabel.month}</span>
                    <span className="timeline-date-day">{dateLabel.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="timeline-body">
              {activities.map((activity) => {
                const completedDates = timelineLookup[activity.id] || new Set<string>();

                return (
                  <div key={activity.id} className="timeline-activity-row">
                    {dateColumns.map((date) => {
                      const isCompleted = completedDates.has(date);
                      return (
                        <div
                          key={`${activity.id}-${date}`}
                          className={`timeline-status-cell ${isCompleted ? 'timeline-status-cell--complete' : 'timeline-status-cell--incomplete'}`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {isLoadingTimeline ? <div className="timeline-loading-more">Loading more timeline...</div> : null}
    </div>
  );
}
