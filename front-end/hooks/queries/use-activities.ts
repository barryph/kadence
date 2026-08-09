import { useQuery } from '@tanstack/react-query';
import { activitiesAPI, type IActivity } from '@/api/api.activity';
import { queryKeys } from '@/lib/query/keys';
import { unwrapApiResponse } from '@/lib/query/unwrap';
import { YYYYMMDD } from '@/utils/date';

async function fetchActivities(today: string): Promise<IActivity[]> {
  const resp = await activitiesAPI.getAllByUser(today);
  const data = unwrapApiResponse(resp);
  return data.activities;
}

async function fetchActivity(
  id: number | string,
  today: string,
): Promise<IActivity> {
  const resp = await activitiesAPI.getById(id, today);
  const data = unwrapApiResponse(resp);
  return data.activity;
}

export function useActivitiesQuery() {
  return useQuery({
    queryKey: queryKeys.activities.all,
    queryFn: () => fetchActivities(YYYYMMDD()),
  });
}

export function useActivityQuery(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities.detail(id ?? ''),
    queryFn: () => fetchActivity(id!, YYYYMMDD()),
    enabled: id !== undefined && id !== '',
  });
}
