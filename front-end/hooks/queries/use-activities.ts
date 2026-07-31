import { useQuery } from '@tanstack/react-query';
import { activitiesAPI, type IActivity } from '@/api/api.activity';
import { queryKeys } from '@/lib/query/keys';
import { unwrapApiResponse } from '@/lib/query/unwrap';

async function fetchActivities(): Promise<IActivity[]> {
  const resp = await activitiesAPI.getAllByUser();
  const data = unwrapApiResponse(resp);
  return data.activities;
}

async function fetchActivity(id: number | string): Promise<IActivity> {
  const resp = await activitiesAPI.getById(id);
  const data = unwrapApiResponse(resp);
  return data.activity;
}

export function useActivitiesQuery() {
  return useQuery({
    queryKey: queryKeys.activities.all,
    queryFn: fetchActivities,
  });
}

export function useActivityQuery(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities.detail(id ?? ''),
    queryFn: () => fetchActivity(id!),
    enabled: id !== undefined && id !== '',
  });
}
