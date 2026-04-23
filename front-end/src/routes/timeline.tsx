import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { activitiesAPI, type IActivity } from "../api/api.activity";
import { timelineAPI, type ITimeline } from '../api/api.timeline';

export const Route = createFileRoute('/timeline')({
  component: Timeline,
})

function Timeline() {
  const [activities, setActivities] = useState<IActivity[] | undefined>();
  const [timeline, setTimeline] = useState<ITimeline | undefined>();
  const [isLoadingInitData, setIsLoadInitData] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      console.log('fetch activities')
      const initMonth = '2026-04'; // TODO: Get Initial month string
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

  return (
    <div>
      IS LOADING: {isLoadingInitData ? 'TRUE' : 'FALSE'}
    </div>
  );
}
