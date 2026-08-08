import { useQuery } from '@tanstack/react-query';
import { activityEventsAPI } from '@/api/api.events';
import { queryKeys } from '@/lib/query/keys';
import { unwrapApiResponse } from '@/lib/query/unwrap';

async function fetchActivityEvents(from: string, to: string) {
  const resp = await activityEventsAPI.getEvents(from, to);
  const data = unwrapApiResponse(resp);
  return data.events;
}

export function useActivityEventsQuery(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.events.range(from, to),
    queryFn: () => fetchActivityEvents(from, to),
    enabled: enabled && from.length > 0 && to.length > 0,
  });
}
